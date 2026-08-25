import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { createClient } from '@supabase/supabase-js';

// TYPESCRIPT INTERFACES
interface Product {
  id: string;
  title: string;
  price: number;
  stock_quantity: number;
  reorder_threshold: number;
  image_url?: string;
}

interface Branch {
  id: string;
  branch_name: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  products?: Product[];
}

// SUPABASE CREDENTIALS (PRE-FILLED WITH YOUR EXACT REAL KEY)
const SUPABASE_URL = "https://ctkxcgzjommxnebqcziy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0a3hjZ3pqb21teG5lYnFjeml5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4OTcxMzksImV4cCI6MjEwMjQ3MzEzOX0.oz1LND1H50ap69su8ZmvplfegCEeEPYg1PoOCKbgVY8";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function Home() {
  const [activeTab, setActiveTab] = useState<'chat' | 'map' | 'merchant'>('chat');

  // CHAT STATE
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Hello! 👋 I am BOBA AI, your universal shopping assistant.\n\nAsk me about any products, prices, or store branches near you!',
      time: 'Just now'
    }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // DATA STATE
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: bData } = await supabase.from('store_branches').select('*');
      const { data: pData } = await supabase.from('products').select('*');
      if (bData) setBranches(bData as Branch[]);
      if (pData) setProducts(pData as Product[]);
    } catch (e) {
      console.error(e);
    }
  };

  // AI CHAT LOGIC
  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    const query = inputText.toLowerCase();
    setInputText('');
    setLoading(true);

    setTimeout(async () => {
      let replyText = "";
      let matchingProducts: Product[] = [];

      const { data: pList } = await supabase.from('products').select('*');
      const { data: bList } = await supabase.from('store_branches').select('*');

      if (pList && pList.length > 0) {
        matchingProducts = (pList as Product[]).filter(p =>
          p.title.toLowerCase().includes(query) || query.includes(p.title.toLowerCase())
        );
      }

      if (matchingProducts.length > 0) {
        replyText = `I found ${matchingProducts.length} product(s) matching "${query}":`;
      } else if (query.includes('store') || query.includes('location') || query.includes('branch') || query.includes('where')) {
        const storeList = bList ? (bList as Branch[]).map(b => `📍 ${b.branch_name}: ${b.address || 'Address N/A'} (${b.phone || 'N/A'})`).join('\n') : 'No store branches found.';
        replyText = `Here are our physical store branches:\n\n${storeList}`;
      } else {
        const allItems = pList ? (pList as Product[]).map(p => `• ${p.title} - $${p.price} (Stock: ${p.stock_quantity})`).join('\n') : 'No items listed.';
        replyText = `I searched our catalog! Here is what is available:\n\n${allItems}\n\nYou can also check the "Store Map" tab to see branch locations!`;
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        products: matchingProducts,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      setLoading(false);
    }, 800);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* WHATSAPP-STYLE HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 BOBA Commerce AI</Text>
        <Text style={styles.headerSubtitle}>Universal Shopping & Store Assistant</Text>
      </View>

      {/* MAIN SCREEN CONTENT */}
      <View style={styles.content}>
        {activeTab === 'chat' && (
          <View style={styles.chatContainer}>
            <FlatList
              data={messages}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={[styles.msgBubble, item.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
                  <Text style={[styles.msgText, item.sender === 'user' ? styles.userMsgText : styles.aiMsgText]}>{item.text}</Text>

                  {/* RENDERING INTERACTIVE PRODUCT CARDS IN AI CHAT */}
                  {item.products && item.products.length > 0 && (
                    <View style={styles.cardList}>
                      {item.products.map((p: Product) => (
                        <View key={p.id} style={styles.productCard}>
                          {p.image_url ? (
                            <Image source={{ uri: p.image_url }} style={styles.cardImage} />
                          ) : (
                            <View style={styles.cardPlaceholder}><Text style={{color: '#888'}}>No Img</Text></View>
                          )}
                          <View style={styles.cardDetails}>
                            <Text style={styles.cardTitle}>{p.title}</Text>
                            <Text style={styles.cardPrice}>${p.price}</Text>
                            <Text style={styles.cardStock}>Stock: {p.stock_quantity} left</Text>
                            <TouchableOpacity style={styles.buyBtn} onPress={() => Alert.alert('Order Placed!', `You ordered ${p.title} for $${p.price}`)}>
                              <Text style={styles.buyBtnText}>🛒 Order Now</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  <Text style={styles.msgTime}>{item.time}</Text>
                </View>
              )}
            />

            {loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#075E54" />
                <Text style={styles.loadingText}>BOBA AI is checking inventory...</Text>
              </View>
            )}

            {/* INPUT BAR */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.textInput}
                placeholder="Ask about products, prices, or stores..."
                value={inputText}
                onChangeText={setInputText}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                <Text style={styles.sendBtnText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'map' && (
          <ScrollView style={styles.tabScroll}>
            <Text style={styles.sectionTitle}>📍 Physical Store Branches</Text>
            <Text style={styles.sectionSub}>All store locations registered by merchants:</Text>

            {branches.map((b: Branch) => (
              <View key={b.id} style={styles.branchCard}>
                <Text style={styles.branchName}>📍 {b.branch_name}</Text>
                <Text style={styles.branchAddress}>{b.address || 'Address not listed'}</Text>
                <Text style={styles.branchPhone}>Phone: {b.phone || 'N/A'}</Text>
                <Text style={styles.branchGeo}>GPS: {b.latitude}, {b.longitude}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {activeTab === 'merchant' && (
          <ScrollView style={styles.tabScroll}>
            <Text style={styles.sectionTitle}>🏪 Live Catalog Overview</Text>
            <Text style={styles.sectionSub}>Real-time products synced with Supabase DB:</Text>

            {products.map((p: Product) => (
              <View key={p.id} style={styles.inventoryRow}>
                {p.image_url ? (
                  <Image source={{ uri: p.image_url }} style={styles.thumbImage} />
                ) : (
                  <View style={styles.thumbPlaceholder}><Text style={{fontSize: 10}}>No Img</Text></View>
                )}
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.pTitle}>{p.title}</Text>
                  <Text style={styles.pPrice}>${p.price} | Stock: {p.stock_quantity}</Text>
                </View>
                <View style={p.stock_quantity <= p.reorder_threshold ? styles.badgeLow : styles.badgeOk}>
                  <Text style={styles.badgeText}>{p.stock_quantity <= p.reorder_threshold ? '⚠️ Low' : 'OK'}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* BOTTOM TAB NAVIGATOR */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'chat' && styles.activeTabItem]} onPress={() => setActiveTab('chat')}>
          <Text style={styles.tabIcon}>💬</Text>
          <Text style={[styles.tabLabel, activeTab === 'chat' && styles.activeTabLabel]}>AI Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabItem, activeTab === 'map' && styles.activeTabItem]} onPress={() => setActiveTab('map')}>
          <Text style={styles.tabIcon}>🗺️</Text>
          <Text style={[styles.tabLabel, activeTab === 'map' && styles.activeTabLabel]}>Store Map</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabItem, activeTab === 'merchant' && styles.activeTabItem]} onPress={() => setActiveTab('merchant')}>
          <Text style={styles.tabIcon}>🏪</Text>
          <Text style={[styles.tabLabel, activeTab === 'merchant' && styles.activeTabLabel]}>Catalog</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5DDD5' },
  header: { backgroundColor: '#075E54', padding: 16, paddingTop: 40 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { color: '#ECE5DD', fontSize: 12, marginTop: 2 },
  content: { flex: 1 },
  chatContainer: { flex: 1, padding: 12 },
  msgBubble: { padding: 12, borderRadius: 10, marginVertical: 4, maxWidth: '85%' },
  userBubble: { backgroundColor: '#DCF8C6', alignSelf: 'flex-end' },
  aiBubble: { backgroundColor: '#FFFFFF', alignSelf: 'flex-start' },
  msgText: { fontSize: 15, color: '#303030' },
  userMsgText: { color: '#000' },
  aiMsgText: { color: '#111' },
  msgTime: { fontSize: 10, color: '#888', marginTop: 4, textAlign: 'right' },
  inputBar: { flexDirection: 'row', backgroundColor: '#FFF', padding: 8, borderRadius: 25, marginTop: 8 },
  textInput: { flex: 1, paddingHorizontal: 12, fontSize: 14 },
  sendBtn: { backgroundColor: '#075E54', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  sendBtnText: { color: '#FFF', fontWeight: 'bold' },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#DDD' },
  tabItem: { flex: 1, padding: 10, alignItems: 'center' },
  activeTabItem: { borderTopWidth: 3, borderColor: '#075E54' },
  tabIcon: { fontSize: 18 },
  tabLabel: { fontSize: 11, color: '#666', marginTop: 2 },
  activeTabLabel: { color: '#075E54', fontWeight: 'bold' },
  cardList: { marginTop: 8 },
  productCard: { backgroundColor: '#F9F9F9', borderRadius: 8, padding: 8, flexDirection: 'row', marginTop: 6, borderWidth: 1, borderColor: '#EEE' },
  cardImage: { width: 60, height: 60, borderRadius: 6 },
  cardPlaceholder: { width: 60, height: 60, backgroundColor: '#DDD', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  cardDetails: { marginLeft: 10, flex: 1 },
  cardTitle: { fontWeight: 'bold', fontSize: 14 },
  cardPrice: { color: '#075E54', fontWeight: 'bold', marginTop: 2 },
  cardStock: { fontSize: 11, color: '#666' },
  buyBtn: { backgroundColor: '#25D366', padding: 6, borderRadius: 4, marginTop: 6, alignItems: 'center' },
  buyBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  loadingText: { marginLeft: 8, color: '#075E54', fontSize: 12 },
  tabScroll: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#075E54' },
  sectionSub: { fontSize: 12, color: '#666', marginBottom: 12 },
  branchCard: { backgroundColor: '#FFF', padding: 14, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#DDD' },
  branchName: { fontWeight: 'bold', fontSize: 16, color: '#075E54' },
  branchAddress: { color: '#333', marginTop: 4 },
  branchPhone: { color: '#666', fontSize: 12, marginTop: 2 },
  branchGeo: { fontSize: 10, color: '#999', marginTop: 4 },
  inventoryRow: { backgroundColor: '#FFF', padding: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  thumbImage: { width: 45, height: 45, borderRadius: 6 },
  thumbPlaceholder: { width: 45, height: 45, backgroundColor: '#EEE', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  pTitle: { fontWeight: 'bold', fontSize: 14 },
  pPrice: { color: '#666', fontSize: 12, marginTop: 2 },
  badgeLow: { backgroundColor: '#FFD2D2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeOk: { backgroundColor: '#D4EDDA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: 'bold' }
});