"use client";

import React from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <WifiOff className="w-24 h-24 mb-6 text-slate-400" />
      <h1 className="text-2xl font-bold mb-4 text-slate-800">Estás desconectado</h1>
      <p className="text-slate-600 max-w-md mx-auto mb-8">
        Parece que no tienes conexión a internet. La aplicación necesita conexión para cargar esta página por primera vez, pero tus datos locales están a salvo.
      </p>
      <button 
        onClick={() => window.location.reload()} 
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Reintentar conexión
      </button>
    </div>
  );
}
