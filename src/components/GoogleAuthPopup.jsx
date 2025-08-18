import React from 'react';

const GoogleAuthPopup = ({ open, onClose, onContinue }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm mx-4 border border-gray-600 text-white">
        <h3 className="text-xl font-bold mb-4 text-center">Aviso de seguridad</h3>
        <p className="mb-6 text-gray-300 text-center">
          El enlace que ves con <span className="font-bold">*.supabase.co</span> es totalmente seguro y corresponde a nuestras credenciales de autenticación.<br />
          No necesitas memorizarlo ni preocuparte: solo aparece porque aún no hemos configurado un dominio propio.
        </p>
        <div className="flex space-x-3 justify-center">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
          >
            Cerrar
          </button>
          <button
            onClick={onContinue}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleAuthPopup;
