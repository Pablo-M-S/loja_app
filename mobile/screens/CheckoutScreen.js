import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';

const VERDE = '#1C682E';
const VERDE_CLARO = '#EAF5EC';

// Validação simples de CPF (mesma lógica do backend, espelhada aqui pra
// dar feedback rápido no campo antes de mandar pro servidor).
function cpfValido(cpf) {
  cpf = String(cpf).replace(/[^\d]/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf[10])) return false;
  return true;
}

export default function CheckoutScreen({ navigation }) {
  const { items, totalPreco, clearCart } = useCart();
  const [cliente, setCliente] = useState(null);
  const [frete, setFrete] = useState(null);
  const [carregandoFrete, setCarregandoFrete] = useState(true);
  const [erroFrete, setErroFrete] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Fluxo de pagamento Pix
  const [cpfInput, setCpfInput] = useState('');
  const [modalPixVisivel, setModalPixVisivel] = useState(false);
  const [pedidoPix, setPedidoPix] = useState(null); // { orderId, qrCodeTexto, ... }
  const [statusPagamento, setStatusPagamento] = useState('PENDING');
  const pollingRef = useRef(null);

  useEffect(() => {
    carregarClienteECalcularFrete();
    return () => pararPolling();
  }, []);

  async function carregarClienteECalcularFrete() {
    setCarregandoFrete(true);
    setErroFrete(null);
    try {
      const salvo = await AsyncStorage.getItem('cliente');
      if (!salvo) throw new Error('Cliente não encontrado. Faça login novamente.');
      const clienteLocal = JSON.parse(salvo);

      const clienteAtualizado = await api.getCustomer(clienteLocal.id);
      setCliente(clienteAtualizado);
      setCpfInput(clienteAtualizado.cpf || '');

      const cotacao = await api.cotarFrete({ endereco: clienteAtualizado.endereco });
      setFrete(cotacao);
    } catch (erro) {
      setErroFrete(erro.message);
    } finally {
      setCarregandoFrete(false);
    }
  }

  const totalGeral = totalPreco + (frete?.valor || 0);

  // Passo 1: garante que o cliente tem CPF salvo (obrigatório pro Pix).
  // Se não tiver, salva o que foi digitado no campo antes de prosseguir.
  async function garantirCpf() {
    if (cliente.cpf) return cliente.cpf;

    const cpfLimpo = cpfInput.replace(/[^\d]/g, '');
    if (!cpfValido(cpfLimpo)) {
      Alert.alert('CPF inválido', 'Confere se o CPF foi digitado corretamente — ele é exigido pela Receita para pagamentos via Pix.');
      throw new Error('CPF inválido');
    }

    const clienteAtualizado = await api.updateCustomer(cliente.id, { cpf: cpfLimpo });
    setCliente(clienteAtualizado);
    await AsyncStorage.setItem('cliente', JSON.stringify(clienteAtualizado));
    return clienteAtualizado.cpf;
  }

  // Passo 2: cria o pedido Pix no PagBank e abre o modal com o QR code.
  async function iniciarPagamentoPix() {
    if (!cliente || !frete) return;

    setEnviando(true);
    try {
      await garantirCpf();

      const itensParaPagamento = items.map((item) => ({
        nome: item.nome,
        quantidade: item.quantidade,
        valorUnitarioCentavos: Math.round(item.preco * 100)
      }));

      const valorTotalCentavos = Math.round(totalGeral * 100);

      const pedido = await api.criarPagamentoPix({
        customerId: cliente.id,
        itens: itensParaPagamento,
        valorTotalCentavos
      });

      setPedidoPix(pedido);
      setStatusPagamento('PENDING');
      setModalPixVisivel(true);
      iniciarPolling(pedido.orderId);
    } catch (erro) {
      if (erro.message !== 'CPF inválido') {
        Alert.alert('Erro ao gerar Pix', erro.message);
      }
    } finally {
      setEnviando(false);
    }
  }

  // Passo 3: fica checando o status do pagamento a cada 4 segundos.
  function iniciarPolling(orderId) {
    pararPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const resultado = await api.consultarStatusPagamento(orderId);
        setStatusPagamento(resultado.status);

        if (resultado.status === 'PAID') {
          pararPolling();
          await finalizarAposPagamento();
        } else if (resultado.status === 'DECLINED' || resultado.status === 'CANCELED') {
          pararPolling();
          Alert.alert('Pagamento não concluído', 'O Pix não foi confirmado. Tente novamente.');
          setModalPixVisivel(false);
        }
      } catch (erro) {
        // Falha pontual de rede no polling não precisa travar a tela — tenta de novo no próximo ciclo.
      }
    }, 4000);
  }

  function pararPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  // Passo 4: pagamento confirmado — registra o pedido e dispara a entrega real na Uber Direct.
  async function finalizarAposPagamento() {
    try {
      const pedido = await api.criarPedido({
        clienteId: cliente.id,
        itens: items,
        frete,
        pagamento: { orderId: pedidoPix.orderId, metodo: 'pix' }
      });

      await api.criarEntrega({
        customerId: cliente.id,
        itens: items.map((item) => ({ nome: item.nome, quantidade: item.quantidade })),
        quoteId: frete.quoteId
      });

      clearCart();
      setModalPixVisivel(false);

      Alert.alert(
        'Pagamento confirmado!',
        `Seu pedido #${pedido.numero} foi pago e a entrega já foi acionada.`,
        [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
      );
    } catch (erro) {
      Alert.alert(
        'Pagamento recebido, mas houve um problema',
        `O Pix foi confirmado, mas não consegui finalizar o pedido automaticamente: ${erro.message}. Entre em contato com o suporte.`
      );
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>

      {/* Endereço de entrega */}
      <View style={styles.card}>
        <Text style={styles.tituloCard}>Endereço de entrega</Text>
        {cliente?.endereco ? (
          <Text style={styles.textoEndereco}>
            {cliente.endereco.rua}, {cliente.endereco.numero}
            {cliente.endereco.complemento ? ` - ${cliente.endereco.complemento}` : ''}
            {'\n'}{cliente.endereco.bairro} - {cliente.endereco.cidade}/{cliente.endereco.estado}
            {'\n'}CEP: {cliente.endereco.cep}
          </Text>
        ) : (
          <ActivityIndicator color={VERDE} />
        )}
      </View>

      {/* Itens do pedido */}
      <View style={styles.card}>
        <Text style={styles.tituloCard}>Itens do pedido</Text>
        {items.map((item) => (
          <View key={item.id} style={styles.linhaItem}>
            <Text style={styles.itemNome} numberOfLines={1}>
              {item.quantidade}x {item.nome}
            </Text>
            <Text style={styles.itemValor}>
              R$ {(item.preco * item.quantidade).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      {/* Frete */}
      <View style={styles.card}>
        <Text style={styles.tituloCard}>Entrega</Text>
        {carregandoFrete && (
          <View style={styles.linhaFrete}>
            <ActivityIndicator color={VERDE} />
            <Text style={styles.textoCalculando}>Calculando frete...</Text>
          </View>
        )}
        {!carregandoFrete && erroFrete && (
          <View>
            <Text style={styles.erroTexto}>Não foi possível calcular o frete: {erroFrete}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={carregarClienteECalcularFrete}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}
        {!carregandoFrete && frete && !erroFrete && (
          <View>
            <View style={styles.linhaResumo}>
              <Text style={styles.labelResumo}>Valor do frete</Text>
              <Text style={styles.valorResumo}>R$ {frete.valor.toFixed(2)}</Text>
            </View>
            {frete.duracaoEstimadaMinutos && (
              <Text style={styles.prazoTexto}>
                Previsão de entrega: ~{frete.duracaoEstimadaMinutos} minutos após confirmação
              </Text>
            )}
          </View>
        )}
      </View>

      {/* CPF — só aparece se o cliente ainda não tiver um salvo */}
      {cliente && !cliente.cpf && (
        <View style={styles.card}>
          <Text style={styles.tituloCard}>CPF do pagador</Text>
          <Text style={styles.textoAuxiliar}>Exigido para pagamento via Pix.</Text>
          <TextInput
            style={styles.input}
            value={cpfInput}
            onChangeText={setCpfInput}
            placeholder="000.000.000-00"
            keyboardType="numeric"
            maxLength={14}
          />
        </View>
      )}

      {/* Resumo final */}
      <View style={styles.card}>
        <View style={styles.linhaResumo}>
          <Text style={styles.labelResumo}>Subtotal</Text>
          <Text style={styles.valorResumo}>R$ {totalPreco.toFixed(2)}</Text>
        </View>
        <View style={styles.linhaResumo}>
          <Text style={styles.labelResumo}>Frete</Text>
          <Text style={styles.valorResumo}>
            {frete ? `R$ ${frete.valor.toFixed(2)}` : '—'}
          </Text>
        </View>
        <View style={[styles.linhaResumo, styles.linhaTotal]}>
          <Text style={styles.labelTotal}>Total</Text>
          <Text style={styles.valorTotal}>R$ {totalGeral.toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.confirmarBtn, (carregandoFrete || erroFrete || enviando) && styles.confirmarBtnDesabilitado]}
        onPress={iniciarPagamentoPix}
        disabled={carregandoFrete || !!erroFrete || enviando}
      >
        {enviando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.confirmarText}>Pagar com Pix</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.avisoPagamento}>
        <Ionicons name="information-circle-outline" size={14} color="#888" />
        {'  '}Você vai escanear um QR code para pagar via Pix.
      </Text>

      {/* Modal com o QR code do Pix */}
      <Modal visible={modalPixVisivel} animationType="slide" transparent>
        <View style={styles.modalFundo}>
          <View style={styles.modalConteudo}>
            <Text style={styles.modalTitulo}>Pague com Pix</Text>

            {pedidoPix?.qrCodeTexto && (
              <View style={styles.qrWrapper}>
                <QRCode value={pedidoPix.qrCodeTexto} size={220} />
              </View>
            )}

            <Text style={styles.modalValor}>R$ {totalGeral.toFixed(2)}</Text>

            {statusPagamento === 'PENDING' && (
              <View style={styles.linhaFrete}>
                <ActivityIndicator color={VERDE} />
                <Text style={styles.textoCalculando}>Aguardando pagamento...</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.cancelarBtn}
              onPress={() => { pararPolling(); setModalPixVisivel(false); }}
            >
              <Text style={styles.cancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: VERDE_CLARO },
  conteudo: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, elevation: 1,
  },
  tituloCard: { fontSize: 15, fontWeight: 'bold', color: '#222', marginBottom: 10 },
  textoEndereco: { fontSize: 14, color: '#444', lineHeight: 20 },
  textoAuxiliar: { fontSize: 12, color: '#888', marginBottom: 8 },

  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, backgroundColor: '#fafafa',
  },

  linhaItem: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6,
  },
  itemNome: { fontSize: 13, color: '#444', flex: 1, marginRight: 10 },
  itemValor: { fontSize: 13, color: '#222', fontWeight: '600' },

  linhaFrete: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  textoCalculando: { color: '#666', fontSize: 13 },
  erroTexto: { color: '#c0392b', fontSize: 13, marginBottom: 8 },
  retryBtn: {
    backgroundColor: VERDE, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
  },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  prazoTexto: { fontSize: 12, color: '#888', marginTop: 4 },

  linhaResumo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  labelResumo: { fontSize: 14, color: '#666' },
  valorResumo: { fontSize: 14, color: '#222', fontWeight: '600' },
  linhaTotal: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10, marginTop: 4, marginBottom: 0 },
  labelTotal: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  valorTotal: { fontSize: 18, fontWeight: 'bold', color: VERDE },

  confirmarBtn: {
    backgroundColor: VERDE, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 4,
  },
  confirmarBtnDesabilitado: { opacity: 0.5 },
  confirmarText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  avisoPagamento: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 12 },

  modalFundo: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  modalConteudo: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', width: '85%',
  },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 16 },
  qrWrapper: { padding: 12, backgroundColor: '#fff', borderRadius: 12, marginBottom: 16 },
  modalValor: { fontSize: 20, fontWeight: 'bold', color: VERDE, marginBottom: 16 },
  cancelarBtn: { marginTop: 16, paddingVertical: 8 },
  cancelarTexto: { color: '#c0392b', fontWeight: '600' },
});
