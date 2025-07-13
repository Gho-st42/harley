// Firebase configuration and initialization
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, serverTimestamp, getDoc } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: (window.ENV && window.ENV.VITE_FIREBASE_API_KEY) || "AIzaSyBLlmkauM1RVuIhS2ZzgcVt_q7l4-bza8U",
    authDomain: `${(window.ENV && window.ENV.VITE_FIREBASE_PROJECT_ID) || "harley-db"}.firebaseapp.com`,
    projectId: (window.ENV && window.ENV.VITE_FIREBASE_PROJECT_ID) || "harley-db",
    storageBucket: `${(window.ENV && window.ENV.VITE_FIREBASE_PROJECT_ID) || "harley-db"}.firebasestorage.app`,
    messagingSenderId: "738946943779",
    appId: (window.ENV && window.ENV.VITE_FIREBASE_APP_ID) || "1:738946943779:web:1a9b55909af9be4492da96",
    measurementId: "G-G5BS37C6W0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global Firebase references
window.auth = auth;
window.db = db;
window.firebaseExports = {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    getDoc
};

// Local fallback data for when Firebase is not properly configured
const localFallbackData = {
    devices: [
        {
            id: 'device-1',
            name: 'Gaming Room 1',
            type: 'gaming',
            rate: 50,
            available: true,
            status: 'available'
        },
        {
            id: 'device-2',
            name: 'Gaming Room 2',
            type: 'gaming',
            rate: 50,
            available: true,
            status: 'available'
        },
        {
            id: 'device-3',
            name: 'Racing Simulator 1',
            type: 'racing',
            rate: 75,
            available: true,
            status: 'available'
        },
        {
            id: 'device-4',
            name: 'Racing Simulator 2',
            type: 'racing',
            rate: 75,
            available: true,
            status: 'available'
        },
        {
            id: 'device-5',
            name: 'Billiard Table 1',
            type: 'billiard',
            rate: 30,
            available: true,
            status: 'available'
        },
        {
            id: 'device-6',
            name: 'Billiard Table 2',
            type: 'billiard',
            rate: 30,
            available: true,
            status: 'available'
        }
    ],
    menu: [
        {
            id: 'menu-1',
            name: 'Club Sandwich',
            nameArabic: 'كلوب ساندويتش',
            category: 'food',
            price: 45,
            description: 'Triple-layer sandwich with chicken, lettuce, and tomato',
            available: true
        },
        {
            id: 'menu-2',
            name: 'Burger Deluxe',
            nameArabic: 'برجر ديلوكس',
            category: 'food',
            price: 55,
            description: 'Juicy beef burger with fries',
            available: true
        },
        {
            id: 'menu-3',
            name: 'Pepsi',
            nameArabic: 'بيبسي',
            category: 'drinks',
            price: 15,
            description: 'Cold soft drink',
            available: true
        },
        {
            id: 'menu-4',
            name: 'Fresh Orange Juice',
            nameArabic: 'عصير برتقال طازج',
            category: 'drinks',
            price: 20,
            description: 'Freshly squeezed orange juice',
            available: true
        },
        {
            id: 'menu-5',
            name: 'Potato Chips',
            nameArabic: 'شيبسي',
            category: 'snacks',
            price: 12,
            description: 'Crispy potato chips',
            available: true
        },
        {
            id: 'menu-6',
            name: 'Popcorn',
            nameArabic: 'فشار',
            category: 'snacks',
            price: 10,
            description: 'Buttery popcorn',
            available: true
        }
    ]
};

// Initialize collections if they don't exist
const initializeCollections = async () => {
    try {
        // Initialize devices collection with default data
        const devicesRef = collection(db, 'devices');
        const devicesSnapshot = await getDocs(devicesRef);
        
        if (devicesSnapshot.empty) {
            const defaultDevices = [
                {
                    name: 'Gaming Room 1',
                    type: 'gaming',
                    rate: 50,
                    available: true,
                    status: 'available',
                    createdAt: serverTimestamp()
                },
                {
                    name: 'Gaming Room 2',
                    type: 'gaming',
                    rate: 50,
                    available: true,
                    status: 'available',
                    createdAt: serverTimestamp()
                },
                {
                    name: 'Racing Simulator 1',
                    type: 'racing',
                    rate: 75,
                    available: true,
                    status: 'available',
                    createdAt: serverTimestamp()
                },
                {
                    name: 'Racing Simulator 2',
                    type: 'racing',
                    rate: 75,
                    available: true,
                    status: 'available',
                    createdAt: serverTimestamp()
                },
                {
                    name: 'Billiard Table 1',
                    type: 'billiard',
                    rate: 30,
                    available: true,
                    status: 'available',
                    createdAt: serverTimestamp()
                },
                {
                    name: 'Billiard Table 2',
                    type: 'billiard',
                    rate: 30,
                    available: true,
                    status: 'available',
                    createdAt: serverTimestamp()
                }
            ];
            
            for (const device of defaultDevices) {
                await addDoc(devicesRef, device);
            }
        }
        
        // Initialize menu collection with default data
        const menuRef = collection(db, 'menu');
        const menuSnapshot = await getDocs(menuRef);
        
        if (menuSnapshot.empty) {
            const defaultMenuItems = [
                {
                    name: 'Club Sandwich',
                    nameArabic: 'كلوب ساندويتش',
                    category: 'food',
                    price: 45,
                    description: 'Triple-layer sandwich with chicken, lettuce, and tomato',
                    available: true,
                    createdAt: serverTimestamp()
                },
                {
                    name: 'Burger Deluxe',
                    nameArabic: 'برجر ديلوكس',
                    category: 'food',
                    price: 55,
                    description: 'Juicy beef burger with fries',
                    available: true,
                    createdAt: serverTimestamp()
                },
                {
                    name: 'Pepsi',
                    nameArabic: 'بيبسي',
                    category: 'drinks',
                    price: 15,
                    description: 'Cold soft drink',
                    available: true,
                    createdAt: serverTimestamp()
                },
                {
                    name: 'Fresh Orange Juice',
                    nameArabic: 'عصير برتقال طازج',
                    category: 'drinks',
                    price: 20,
                    description: 'Freshly squeezed orange juice',
                    available: true,
                    createdAt: serverTimestamp()
                },
                {
                    name: 'Potato Chips',
                    nameArabic: 'شيبسي',
                    category: 'snacks',
                    price: 12,
                    description: 'Crispy potato chips',
                    available: true,
                    createdAt: serverTimestamp()
                },
                {
                    name: 'Popcorn',
                    nameArabic: 'فشار',
                    category: 'snacks',
                    price: 10,
                    description: 'Buttery popcorn',
                    available: true,
                    createdAt: serverTimestamp()
                }
            ];
            
            for (const item of defaultMenuItems) {
                await addDoc(menuRef, item);
            }
        }
        
        console.log('Firebase collections initialized successfully');
    } catch (error) {
        console.error('Error initializing collections:', error);
    }
};

// Initialize collections when Firebase is ready
initializeCollections();

// Helper functions
window.FirebaseHelper = {
    // Add document to collection
    async addDocument(collectionName, data) {
        try {
            const docRef = await addDoc(collection(db, collectionName), {
                ...data,
                createdAt: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding document:', error);
            // For demo purposes, return a random ID
            return 'demo-' + Math.random().toString(36).substr(2, 9);
        }
    },
    
    // Get all documents from collection
    async getDocuments(collectionName, conditions = []) {
        try {
            let q = collection(db, collectionName);
            
            if (conditions.length > 0) {
                q = query(q, ...conditions);
            }
            
            const querySnapshot = await getDocs(q);
            const documents = [];
            
            querySnapshot.forEach((doc) => {
                documents.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return documents;
        } catch (error) {
            console.warn('Firebase access denied - using local data. Configure Firebase security rules to enable full functionality.');
            // Return local fallback data
            if (collectionName === 'devices') {
                return localFallbackData.devices;
            } else if (collectionName === 'menu_items') {
                return localFallbackData.menu;
            }
            return [];
        }
    },
    
    // Update document
    async updateDocument(collectionName, docId, data) {
        try {
            const docRef = doc(db, collectionName, docId);
            await updateDoc(docRef, {
                ...data,
                updatedAt: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error updating document:', error);
            throw error;
        }
    },
    
    // Delete document
    async deleteDocument(collectionName, docId) {
        try {
            const docRef = doc(db, collectionName, docId);
            await deleteDoc(docRef);
            return true;
        } catch (error) {
            console.error('Error deleting document:', error);
            throw error;
        }
    },
    
    // Listen to collection changes
    subscribeToCollection(collectionName, callback, conditions = []) {
        try {
            let q = collection(db, collectionName);
            
            if (conditions.length > 0) {
                q = query(q, ...conditions);
            }
            
            return onSnapshot(q, (querySnapshot) => {
                const documents = [];
                querySnapshot.forEach((doc) => {
                    documents.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                callback(documents);
            }, (error) => {
                console.warn('Firebase real-time subscription failed - using local data');
                // Use local fallback data
                if (collectionName === 'devices') {
                    callback(localFallbackData.devices);
                } else if (collectionName === 'menu_items') {
                    callback(localFallbackData.menu);
                } else {
                    callback([]);
                }
            });
        } catch (error) {
            console.warn('Error subscribing to collection - using local data');
            // Use local fallback data
            if (collectionName === 'devices') {
                callback(localFallbackData.devices);
            } else if (collectionName === 'menu_items') {
                callback(localFallbackData.menu);
            } else {
                callback([]);
            }
            return () => {}; // Return empty unsubscribe function
        }
    }
};

console.log('Firebase configuration loaded successfully');
