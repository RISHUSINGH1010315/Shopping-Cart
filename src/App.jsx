import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, ShoppingCart, Loader2, Package, History, LogOut, 
  CheckCircle, AlertCircle, Smartphone, Shirt, Search, Menu, X,
  Star, Filter, ArrowRight, TrendingUp, Zap, ChevronLeft, ShieldCheck, Truck,
  Laptop, Watch, Home as HomeIcon
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, onSnapshot } from 'firebase/firestore';

// --- Firebase Configuration ---
// 1. DELETE the old "JSON.parse" line
// 2. PASTE your real config object below (I will show you how to get it)

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyCPqvd4T-mp8ZsRzSHSMjrS_7Flk7NeYWI",
  authDomain: "shopping-cart-cef08.firebaseapp.com",
  projectId: "shopping-cart-cef08",
  storageBucket: "shopping-cart-cef08.firebasestorage.app",
  messagingSenderId: "717431257550",
  appId: "1:717431257550:web:ec26a2178a47ab4dbad39f",
  measurementId: "G-754QEEDBHF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'shopping-cart-cef08';
// --- Asset Mapping & Smart Categorization ---
const BASE_ASSETS = {
  "Mobiles": {
    img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600",
    desc: "Advanced mobile technology with cutting-edge features."
  },
  "Laptops": {
    img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=600",
    desc: "High-performance workstation for professionals and gamers."
  },
  "Fashion": {
    img: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=600",
    desc: "Premium fabric blends designed for comfort and style."
  },
  "Watches": {
    img: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=600",
    desc: "Timeless elegance on your wrist."
  },
  "Home": {
    img: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=600",
    desc: "Upgrade your living space with smart home essentials."
  }
};

// Specific overrides for hero items
const SPECIFIC_ASSETS = {
  "iPhone 15 Pro": { img: "https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&q=80&w=600", rating: 5 },
  "Samsung S24 Ultra": { img: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&q=80&w=600", rating: 5 },
  "Classic White Tee": { img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600", rating: 5 }
};

const getProductAsset = (name) => {
  // 1. Check specific overrides
  if (SPECIFIC_ASSETS[name]) {
    // Determine category for specific item
    let cat = "General";
    if (name.includes("iPhone") || name.includes("Samsung")) cat = "Mobiles";
    if (name.includes("Tee")) cat = "Fashion";
    return { ...SPECIFIC_ASSETS[name], category: cat, desc: BASE_ASSETS[cat]?.desc || "Premium item." };
  }

  // 2. Smart Category Matching
  const n = name.toLowerCase();
  let category = "General";
  let assetBase = { img: "https://placehold.co/600x600/27272a/a1a1aa?text=Product", desc: "Quality Item" };

  if (n.includes('phone') || n.includes('galaxy') || n.includes('pixel') || n.includes('oneplus') || n.includes('xiaomi') || n.includes('iphone')) {
    category = "Mobiles";
    assetBase = BASE_ASSETS["Mobiles"];
  } else if (n.includes('macbook') || n.includes('laptop') || n.includes('dell') || n.includes('hp') || n.includes('thinkpad') || n.includes('asus')) {
    category = "Laptops";
    assetBase = BASE_ASSETS["Laptops"];
  } else if (n.includes('shirt') || n.includes('tee') || n.includes('jean') || n.includes('sneaker') || n.includes('jacket') || n.includes('saree') || n.includes('polo')) {
    category = "Fashion";
    assetBase = BASE_ASSETS["Fashion"];
  } else if (n.includes('watch') || n.includes('rolex') || n.includes('fossil') || n.includes('titan')) {
    category = "Watches";
    assetBase = BASE_ASSETS["Watches"];
  } else if (n.includes('bulb') || n.includes('vacuum') || n.includes('coffee') || n.includes('blender') || n.includes('home') || n.includes('purifier')) {
    category = "Home";
    assetBase = BASE_ASSETS["Home"];
  }

  // 3. Generate pseudo-random rating based on name length
  const rating = (name.length % 2) + 3.5; // 3.5 or 4.5

  return {
    img: assetBase.img,
    category: category,
    rating: rating,
    desc: assetBase.desc,
    longDesc: `${assetBase.desc} This ${name} features premium build quality and comes with a standard warranty.`
  };
};

// --- Helper: Generate 100 Items ---
const generateSeedData = () => {
  const items = [];
  const categories = [
    { 
      type: 'Mobiles', 
      brands: ['iPhone 15', 'Samsung Galaxy S24', 'Google Pixel 8', 'OnePlus 12', 'Xiaomi 14'], 
      suffixes: ['Pro', 'Ultra', 'Plus', 'Lite', '5G'],
      priceRange: [15000, 150000] 
    },
    { 
      type: 'Laptops', 
      brands: ['MacBook Air', 'Dell XPS 13', 'HP Spectre', 'Lenovo ThinkPad', 'Asus ROG Zephyrus'], 
      suffixes: ['M3', 'Pro', 'Elite', 'Gaming', 'OLED'],
      priceRange: [35000, 250000] 
    },
    { 
      type: 'Fashion', 
      brands: ['Cotton Tee', 'Denim Jeans', 'Urban Sneaker', 'Leather Jacket', 'Silk Saree'], 
      suffixes: ['Blue', 'Black', 'Vintage', 'Slim Fit', 'Premium'],
      priceRange: [500, 5000] 
    },
    { 
      type: 'Watches', 
      brands: ['Fossil Gen 6', 'Apple Watch', 'Titan Raga', 'Casio G-Shock', 'Seiko 5'], 
      suffixes: ['Metal', 'Sport', 'Classic', 'Gold', 'Chronograph'],
      priceRange: [2000, 50000] 
    },
    { 
      type: 'Home', 
      brands: ['Philips Smart Bulb', 'Dyson Air Purifier', 'Robot Vacuum', 'Nespresso Coffee Maker', 'Nutribullet Blender'], 
      suffixes: ['v2', 'Pro', 'Smart', 'Elite', 'Max'],
      priceRange: [500, 20000] 
    }
  ];

  let idCounter = 1;
  categories.forEach(cat => {
    // Generate 20 items per category
    for (let i = 0; i < 20; i++) {
      const brand = cat.brands[i % cat.brands.length];
      const suffix = cat.suffixes[i % cat.suffixes.length];
      // Random price within range
      const price = Math.floor(Math.random() * (cat.priceRange[1] - cat.priceRange[0]) + cat.priceRange[0]);
      // Round price to nearest 99 for aesthetic
      const prettyPrice = Math.floor(price / 100) * 100 + 99;
      
      items.push({
        name: `${brand} ${suffix} ${String.fromCharCode(65 + i)}`, // e.g., "iPhone 15 Pro A"
        price: prettyPrice
      });
    }
  });
  
  // Shuffle array
  return items.sort(() => Math.random() - 0.5);
};

// --- Components ---

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-24 right-6 z-50 animate-in slide-in-from-right fade-in duration-300">
      <div className="bg-zinc-900/90 backdrop-blur-md border border-red-900/50 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-red-900/20 flex items-center gap-4">
        <div className="bg-red-900/30 p-2 rounded-full text-red-500">
          <CheckCircle size={20} strokeWidth={3} />
        </div>
        <div>
          <h4 className="font-bold text-sm">Notification</h4>
          <p className="text-sm text-gray-400">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); 
  const [toastMsg, setToastMsg] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [activeItem, setActiveItem] = useState(null);

  // Auth Init
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth failed", error);
      }
      setLoadingAuth(false);
    };
    initAuth();
  }, []);

  // Cart Listener
  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      const cartsRef = collection(db, 'artifacts', appId, 'public', 'data', 'carts');
      const q = query(cartsRef, where("user_id", "==", user.id), where("status", "==", "active"));
      const cartSnap = await getDocs(q);
      
      if (!cartSnap.empty) {
        const cartId = cartSnap.docs[0].id;
        const ciRef = collection(db, 'artifacts', appId, 'public', 'data', 'cart_items');
        const iQ = query(ciRef, where("cart_id", "==", cartId));
        return onSnapshot(iQ, (snap) => setCartCount(snap.size));
      } else {
        setCartCount(0);
      }
    };
    fetchCount();
  }, [user]);

  const showToast = (msg) => setToastMsg(msg);
  
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setView('items');
    showToast(`Welcome back, ${userData.username}!`);
  };

  const handleLogout = () => { setUser(null); setView('login'); setCartCount(0); setActiveItem(null); };

  const handleItemClick = (item) => {
    setActiveItem(item);
    setView('details');
  };

  const addToCart = async (item) => {
    try {
      const cartsRef = collection(db, 'artifacts', appId, 'public', 'data', 'carts');
      const q = query(cartsRef, where("user_id", "==", user.id), where("status", "==", "active"));
      const cartSnap = await getDocs(q);
      
      let cartId;
      if (cartSnap.empty) {
        const newCart = await addDoc(cartsRef, { user_id: user.id, status: "active", created_at: new Date().toISOString() });
        cartId = newCart.id;
      } else {
        cartId = cartSnap.docs[0].id;
      }

      const cartItemsRef = collection(db, 'artifacts', appId, 'public', 'data', 'cart_items');
      await addDoc(cartItemsRef, { 
        cart_id: cartId, 
        item_id: item.id, 
        item_name: item.name, 
        price: item.price 
      });
      
      showToast(`Added to cart: ${item.name}`);
    } catch (e) {
      console.error(e);
      showToast("Error adding item");
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-red-600" size={40} />
          <p className="text-zinc-500 font-medium">Loading Store...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black font-sans text-white selection:bg-red-900/30 selection:text-red-200">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-40 bg-black/80 backdrop-blur-xl border-b border-zinc-800 transition-all duration-300">
        <div className="container mx-auto px-4 h-20 flex justify-between items-center">
          {/* Brand */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => user && setView('items')}>
            <div className="bg-gradient-to-br from-red-600 to-red-900 p-2.5 rounded-xl text-white shadow-lg shadow-red-900/40 group-hover:scale-105 transition duration-300">
              <ShoppingBag size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                LuxeCart
              </h1>
              <p className="text-[10px] text-red-500 font-bold tracking-wider uppercase">Premium Store</p>
            </div>
          </div>

          {/* Nav */}
          {user && (
            <nav className="flex items-center gap-3 sm:gap-6">
              <button 
                onClick={() => setView('items')} 
                className={`hidden md:flex items-center gap-2 text-sm font-semibold transition-all px-4 py-2 rounded-full ${view === 'items' || view === 'details' ? 'bg-red-600 text-white shadow-lg shadow-red-900/30' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
              >
                <Search size={18} /> Store
              </button>
              
              <button 
                onClick={() => setView('orders')} 
                className={`hidden md:flex items-center gap-2 text-sm font-semibold transition-all px-4 py-2 rounded-full ${view === 'orders' ? 'bg-red-600 text-white shadow-lg shadow-red-900/30' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
              >
                <History size={18} /> Orders
              </button>

              <div className="h-8 w-px bg-zinc-800 hidden md:block"></div>

              <button onClick={() => setView('cart')} className="relative p-3 group rounded-full hover:bg-zinc-900 transition">
                <div className={`absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full border-2 border-black transition-all duration-300 ${cartCount > 0 ? 'bg-red-600 text-white scale-100 shadow-md shadow-red-900/50' : 'bg-transparent text-transparent scale-0'}`}>
                  {cartCount}
                </div>
                <ShoppingCart className="text-zinc-400 group-hover:text-white transition" size={22} />
              </button>
              
              <button onClick={handleLogout} className="p-3 text-zinc-500 hover:text-red-500 hover:bg-red-950/30 rounded-full transition" title="Logout">
                <LogOut size={20} />
              </button>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 container mx-auto min-h-screen flex flex-col">
        {!user ? (
          <LoginScreen onLogin={handleLoginSuccess} showToast={showToast} />
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out flex-grow">
            {view === 'items' && <ItemsScreen user={user} showToast={showToast} onItemClick={handleItemClick} addToCart={addToCart} />}
            {view === 'details' && activeItem && <ProductDetailsScreen item={activeItem} addToCart={addToCart} onBack={() => setView('items')} />}
            {view === 'cart' && <CartScreen user={user} showToast={showToast} setView={setView} />}
            {view === 'orders' && <OrderHistoryScreen user={user} showToast={showToast} />}
          </div>
        )}
      </main>

      {/* Footer */}
      {user && (
        <footer className="border-t border-zinc-800 py-10 bg-black">
          <div className="container mx-auto px-4 text-center">
            <div className="flex justify-center items-center gap-2 mb-4 opacity-50">
               <ShoppingBag size={16} className="text-red-500"/>
               <span className="font-bold text-zinc-400">LuxeCart</span>
            </div>
            <p className="text-zinc-600 text-sm">© 2024 LuxeCart Inc. • Built with React & Firebase</p>
          </div>
        </footer>
      )}

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
    </div>
  );
}

// --- 1. Login Screen ---
function LoginScreen({ onLogin, showToast }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
      const q = query(usersRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        const newUser = { username, password, createdAt: new Date().toISOString() };
        const docRef = await addDoc(usersRef, newUser);
        onLogin({ ...newUser, id: docRef.id });
      } else {
        const userDoc = querySnapshot.docs[0].data();
        if (userDoc.password === password) {
          onLogin({ ...userDoc, id: querySnapshot.docs[0].id });
        } else {
          window.alert("Invalid username or password");
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Login System Error");
    }
    setLoading(false);
  };

  return (
    <div className="flex-grow flex items-center justify-center -mt-10">
      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-800 min-h-[600px]">
        <div className="relative bg-red-900 hidden md:flex flex-col items-center justify-center p-12 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-black/40 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-600/30 rounded-full blur-3xl -ml-16 -mb-16"></div>
          
          <div className="relative z-10 text-center">
             <div className="bg-black/30 backdrop-blur-md p-4 rounded-2xl inline-block mb-6 shadow-xl border border-white/10">
                <ShoppingBag size={48} className="text-red-500"/>
             </div>
             <h2 className="text-4xl font-bold mb-4">Discover Luxury</h2>
             <p className="text-red-100 text-lg max-w-sm mx-auto">Join our exclusive community and shop the world's finest mobile tech and fashion.</p>
          </div>
        </div>

        <div className="p-10 md:p-16 flex flex-col justify-center bg-zinc-950">
          <div className="mb-8">
            <h3 className="text-3xl font-bold text-white mb-2">Welcome Back</h3>
            <p className="text-zinc-500">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-400 ml-1">Username</label>
              <input 
                type="text" required 
                className="w-full px-5 py-4 bg-zinc-900 border-2 border-zinc-800 rounded-xl focus:bg-zinc-900 focus:border-red-600 focus:ring-4 focus:ring-red-900/20 outline-none transition font-medium text-white placeholder:text-zinc-600"
                placeholder="Enter Your Username"
                value={username} onChange={e => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-400 ml-1">Password</label>
              <input 
                type="password" required 
                className="w-full px-5 py-4 bg-zinc-900 border-2 border-zinc-800 rounded-xl focus:bg-zinc-900 focus:border-red-600 focus:ring-4 focus:ring-red-900/20 outline-none transition font-medium text-white placeholder:text-zinc-600"
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
              />
            </div>
            <button 
              disabled={loading} 
              type="submit" 
              className="w-full bg-red-600 text-white py-4 rounded-xl hover:bg-red-700 active:scale-[0.98] transition-all duration-200 font-bold text-lg shadow-xl shadow-red-900/20 flex items-center justify-center gap-2 group"
            >
              {loading ? <Loader2 className="animate-spin" /> : <>Sign In <ArrowRight size={20} className="group-hover:translate-x-1 transition"/></>}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-zinc-900 text-center">
            <p className="text-sm text-zinc-600">New here? We'll create an account automatically.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 2. Enhanced Items Screen ---
function ItemsScreen({ user, showToast, onItemClick, addToCart }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");

  const CATEGORIES = ["All", "Mobiles", "Laptops", "Fashion", "Watches", "Home"];

  useEffect(() => {
    const fetchItems = async () => {
      const itemsRef = collection(db, 'artifacts', appId, 'public', 'data', 'items');
      const snapshot = await getDocs(itemsRef);
      
      // If collection is small (or empty), seed 100 items
      if (snapshot.size < 10) { 
         const seedItems = generateSeedData();
         for (const s of seedItems) {
           // Basic check to avoid duplicates during re-renders if concurrent
           // But firestore `addDoc` creates unique IDs anyway.
           // We'll just fire and forget for speed in this demo context.
           await addDoc(itemsRef, s);
         }
         // Re-fetch after seeding
         const newSnap = await getDocs(itemsRef);
         setItems(newSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else {
        setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }
      setLoading(false);
    };
    fetchItems();
  }, []);

  const filteredItems = items.filter(item => {
    if (category === "All") return true;
    const asset = getProductAsset(item.name);
    return asset.category === category;
  });

  return (
    <div className="max-w-6xl mx-auto">
      {/* Dynamic Hero */}
      <div className="relative bg-zinc-900 rounded-3xl p-10 md:p-16 mb-12 text-white shadow-2xl overflow-hidden group border border-zinc-800">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-30 group-hover:scale-105 transition duration-700"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
        
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 text-red-500 font-bold tracking-wider text-xs uppercase mb-4">
             <Zap size={14} fill="currentColor"/> New Collection Drop
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight text-white">Elevate Your Lifestyle Today.</h1>
          <p className="text-zinc-400 text-lg mb-8 leading-relaxed">Discover our curated selection of flagship devices and premium apparel designed for the modern connoisseur.</p>
          <button className="bg-red-600 text-white px-8 py-3 rounded-full font-bold hover:bg-red-700 transition flex items-center gap-2 shadow-lg shadow-red-900/30">
            Explore Now <ArrowRight size={18}/>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
        <div className="flex gap-2 bg-zinc-900 p-1.5 rounded-2xl shadow-sm border border-zinc-800">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                category === cat 
                ? "bg-red-600 text-white shadow-lg shadow-red-900/30" 
                : "text-zinc-500 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm font-semibold text-zinc-500 bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800">
           <Filter size={14}/> Sort by: Popular
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3].map(i => <div key={i} className="h-96 bg-zinc-900 rounded-3xl animate-pulse"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item) => {
            const asset = getProductAsset(item.name);
            return (
              <div 
                key={item.id} 
                onClick={() => onItemClick(item)}
                className="group bg-zinc-900 rounded-3xl p-4 shadow-sm hover:shadow-2xl hover:shadow-red-900/10 transition-all duration-300 border border-zinc-800 flex flex-col hover:-translate-y-1 cursor-pointer"
              >
                {/* Image */}
                <div className="relative h-64 rounded-2xl overflow-hidden bg-zinc-950 mb-5 border border-zinc-800">
                  <img 
                    src={asset.img} 
                    alt={item.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700 opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="bg-black/80 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider shadow-sm border border-zinc-700">
                      {asset.category}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="px-2 pb-2 flex-grow flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-red-500 transition line-clamp-1">{item.name}</h3>
                    <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-lg border border-yellow-500/20">
                      <Star size={12} fill="currentColor"/>
                      <span className="text-xs font-bold text-yellow-500">{asset.rating}</span>
                    </div>
                  </div>
                  <p className="text-zinc-500 text-sm mb-6 line-clamp-2 leading-relaxed">{asset.desc}</p>
                  
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-zinc-800">
                    <div>
                        <p className="text-xs text-zinc-500 font-semibold uppercase">Price</p>
                        <span className="text-2xl font-bold text-white">₹{item.price.toLocaleString('en-IN')}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                      className="text-sm font-bold text-red-500 bg-red-900/20 px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white transition z-10 border border-red-900/30"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- Product Details Screen ---
function ProductDetailsScreen({ item, addToCart, onBack }) {
  const asset = getProductAsset(item.name);
  
  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-zinc-400 font-medium hover:text-white transition bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 shadow-sm"
      >
        <ChevronLeft size={20}/> Back to Store
      </button>

      <div className="bg-zinc-900 rounded-3xl p-6 md:p-10 shadow-lg border border-zinc-800 flex flex-col md:flex-row gap-10 lg:gap-16">
        <div className="w-full md:w-1/2">
           <div className="relative aspect-square rounded-3xl overflow-hidden bg-zinc-950 shadow-inner border border-zinc-800">
             <img src={asset.img} alt={item.name} className="w-full h-full object-cover hover:scale-105 transition duration-700 opacity-90 hover:opacity-100"/>
             <div className="absolute top-4 left-4 bg-black/80 backdrop-blur px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-sm border border-zinc-700">
                {asset.category}
             </div>
           </div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col">
           <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                 <Star size={16} fill="currentColor"/>
                 <span className="font-bold text-sm">{asset.rating} (124 reviews)</span>
              </div>
              <div className="text-green-500 bg-green-500/10 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-green-500/20">
                 <CheckCircle size={14}/> In Stock
              </div>
           </div>

           <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">{item.name}</h1>
           <div className="text-3xl font-extrabold text-red-500 mb-8">₹{item.price.toLocaleString('en-IN')}</div>
           
           <div className="prose prose-invert mb-8">
              <p className="text-zinc-400 text-lg leading-relaxed">{asset.longDesc || asset.desc}</p>
           </div>

           <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                 <Truck className="text-red-600" size={24}/>
                 <div>
                    <div className="font-bold text-sm text-white">Free Delivery</div>
                    <div className="text-xs text-zinc-500">2-3 Business Days</div>
                 </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                 <ShieldCheck className="text-red-600" size={24}/>
                 <div>
                    <div className="font-bold text-sm text-white">1 Year Warranty</div>
                    <div className="text-xs text-zinc-500">Official Support</div>
                 </div>
              </div>
           </div>

           <div className="mt-auto flex gap-4">
              <button 
                onClick={() => addToCart(item)}
                className="flex-grow bg-red-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-red-700 shadow-xl shadow-red-900/30 active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                 <ShoppingCart size={20}/> Add to Cart
              </button>
              <button className="p-4 rounded-2xl border-2 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 transition text-zinc-400">
                 <TrendingUp size={24}/>
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

// --- Cart Screen ---
function CartScreen({ user, showToast, setView }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCartId, setActiveCartId] = useState(null);

  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      const cartsRef = collection(db, 'artifacts', appId, 'public', 'data', 'carts');
      const q = query(cartsRef, where("user_id", "==", user.id), where("status", "==", "active"));
      const cartSnap = await getDocs(q);

      if (!cartSnap.empty) {
        const cartId = cartSnap.docs[0].id;
        setActiveCartId(cartId);
        const ciRef = collection(db, 'artifacts', appId, 'public', 'data', 'cart_items');
        const iQ = query(ciRef, where("cart_id", "==", cartId));
        const unsubscribe = onSnapshot(iQ, (snap) => {
          setCartItems(snap.docs.map(d => d.data()));
          setLoading(false);
        });
        return () => unsubscribe();
      } else {
        setCartItems([]);
        setLoading(false);
      }
    };
    fetchCart();
  }, [user]);

  const handleCheckout = async () => {
    if (!activeCartId) return;
    try {
      const cartsRef = doc(db, 'artifacts', appId, 'public', 'data', 'carts', activeCartId);
      await updateDoc(cartsRef, { status: "ordered" });
      const ordersRef = collection(db, 'artifacts', appId, 'public', 'data', 'orders');
      await addDoc(ordersRef, { user_id: user.id, cart_id: activeCartId, created_at: new Date().toISOString() });
      showToast("Order Placed Successfully!");
      setActiveCartId(null);
      setCartItems([]);
    } catch(e) { console.error(e); }
  };

  const showItemIds = () => {
    if (cartItems.length === 0) return showToast("Cart is empty");
    const info = cartItems.map(i => `ID: ${i.item_id} | ${i.item_name}`).join('\n');
    window.alert(`Cart ID: ${activeCartId}\n\n${info}`);
  }

  const total = cartItems.reduce((acc, curr) => acc + (curr.price||0), 0);
  const tax = total * 0.18; 

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-red-600"/></div>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
         <div>
            <h2 className="text-3xl font-bold text-white">Shopping Cart</h2>
            <p className="text-zinc-500 mt-1">{cartItems.length} items in your bag</p>
         </div>
         <button onClick={showItemIds} className="text-xs font-semibold bg-zinc-800 px-3 py-1 rounded text-zinc-400 hover:text-white transition">Debug IDs</button>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-grow space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-20 bg-zinc-900 rounded-3xl border border-dashed border-zinc-800">
              <div className="bg-zinc-950 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-700">
                <ShoppingBag size={40}/>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Your cart is empty</h3>
              <p className="text-zinc-500 mb-8 max-w-xs mx-auto">Looks like you haven't added anything to your cart yet.</p>
              <button onClick={() => setView('items')} className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition">
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="bg-zinc-900 rounded-3xl shadow-sm border border-zinc-800 overflow-hidden">
              {cartItems.map((item, i) => {
                 const asset = getProductAsset(item.item_name);
                 return (
                  <div key={i} className="p-6 flex items-center gap-6 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50 transition">
                    <div className="w-24 h-24 rounded-2xl bg-zinc-950 overflow-hidden flex-shrink-0 border border-zinc-800">
                         <img src={asset.img} className="w-full h-full object-cover opacity-80" alt=""/>
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                         <div>
                            <h4 className="font-bold text-lg text-white mb-1">{item.item_name}</h4>
                            <p className="text-sm text-zinc-500">{asset.category} • In Stock</p>
                         </div>
                         <div className="font-bold text-xl text-white">₹{item.price.toLocaleString('en-IN')}</div>
                      </div>
                      <div className="mt-4 flex gap-4 text-sm font-medium text-zinc-500">
                         <button className="hover:text-red-500 transition flex items-center gap-1"><X size={14}/> Remove</button>
                         <button className="hover:text-white transition">Move to Wishlist</button>
                      </div>
                    </div>
                  </div>
                 )
              })}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="lg:w-96 flex-shrink-0">
            <div className="bg-zinc-900 p-8 rounded-3xl shadow-lg shadow-black/50 border border-zinc-800 sticky top-28">
              <h3 className="text-xl font-bold mb-6 text-white">Order Summary</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-zinc-400">
                    <span>Subtotal</span>
                    <span className="font-medium text-white">₹{total.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                    <span>GST (18%)</span>
                    <span className="font-medium text-white">₹{tax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                    <span>Shipping</span>
                    <span className="text-green-500 font-bold text-sm bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">Free</span>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-6 mb-8">
                <div className="flex justify-between items-end">
                    <span className="text-lg font-bold text-white">Total</span>
                    <span className="text-3xl font-extrabold text-red-500">₹{(total + tax).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-red-700 active:scale-[0.98] transition-all shadow-xl shadow-red-900/30 flex items-center justify-center gap-2"
              >
                Checkout <ArrowRight size={20}/>
              </button>
              
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500 font-medium">
                 <CheckCircle size={12}/> Secure SSL Encryption
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Order History ---
function OrderHistoryScreen({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const ordersRef = collection(db, 'artifacts', appId, 'public', 'data', 'orders');
      const q = query(ordersRef, where("user_id", "==", user.id));
      const snap = await getDocs(q);
      setOrders(snap.docs.map(d => ({id: d.id, ...d.data()})));
      setLoading(false);
    };
    fetchOrders();
  }, [user]);

  const showOrderIds = () => {
      const ids = orders.map(o => o.id).join('\n');
      window.alert(`Placed Orders:\n${ids}`);
  }

  return (
    <div className="max-w-4xl mx-auto">
       <div className="flex items-center justify-between mb-8">
         <div>
            <h2 className="text-3xl font-bold text-white">Order History</h2>
            <p className="text-zinc-500 mt-1">Track and manage your past purchases.</p>
         </div>
        <button onClick={showOrderIds} className="bg-zinc-900 border border-zinc-800 font-semibold text-zinc-400 px-4 py-2 rounded-xl text-sm hover:bg-zinc-800 hover:text-white transition">Show IDs</button>
      </div>

      {loading ? <Loader2 className="animate-spin mx-auto text-red-600"/> : orders.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900 rounded-3xl border border-dashed border-zinc-800">
           <div className="bg-zinc-950 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-700">
              <History size={32}/>
           </div>
           <p className="text-zinc-500 font-medium">No past orders found.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map(order => (
            <div key={order.id} className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-sm hover:shadow-lg hover:shadow-red-900/10 transition-all group">
               <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-500/10 p-3 rounded-2xl text-green-500 border border-green-500/20">
                       <Package size={24}/>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-bold text-white text-lg">Order #{order.id.slice(0,8)}</h4>
                            <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-green-500/20">
                                <CheckCircle size={12}/> Completed
                            </span>
                        </div>
                        <div className="text-zinc-500 text-sm flex items-center gap-4">
                           <span>Placed on {new Date(order.created_at).toLocaleDateString()}</span>
                           <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                           <span className="font-mono">Cart: {order.cart_id.slice(0,6)}...</span>
                        </div>
                    </div>
                  </div>
                  <button className="text-red-500 font-bold text-sm bg-red-900/10 px-5 py-2.5 rounded-xl hover:bg-red-900/30 transition opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 duration-300 border border-red-900/20">
                     View Invoice
                  </button>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}