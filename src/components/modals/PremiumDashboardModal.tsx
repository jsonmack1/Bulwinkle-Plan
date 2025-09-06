'use client'

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../lib/subscription-mock';

interface PremiumDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PremiumDashboardModal: React.FC<PremiumDashboardModalProps> = ({ 
  isOpen, 
  onClose
}) => {
  const { user } = useAuth();
  const { isPremium } = useSubscription();

  if (!isOpen || !isPremium) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Background overlay */}
      <div 
        className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Background pattern */}
          <div 
            className="absolute inset-0 bg-cover bg-center rounded-2xl"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-orange-50/80 rounded-2xl"></div>
          </div>

          {/* Content */}
          <div className="relative p-8">
            {/* Premium Dashboard Header */}
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">✨🎉✨</div>
              <div className="inline-flex items-center bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4 shadow-xl">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                PRO MEMBER ACTIVE
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                🚀 Welcome to Your Teaching Superpower! 
              </h1>
              <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-2">
                You've unlocked unlimited lesson planning, intelligent differentiation, and your personal Memory Bank.
              </p>
              <p className="text-gray-600 max-w-xl mx-auto">
                Time to transform how you teach, {user?.name}!
              </p>
            </div>

            {/* Premium Feature Cards - Now Functional Buttons */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <Link 
                href="/?builder=true"
                onClick={onClose}
                className="group bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 backdrop-blur-sm rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-purple-200 hover:border-purple-300"
              >
                <div className="text-center">
                  <div className="text-4xl mb-3 group-hover:animate-bounce filter drop-shadow-lg">🚀</div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">Create Pro Lessons</h3>
                  <p className="text-gray-700 text-sm mb-3 font-medium">Generate unlimited lesson plans with intelligence differentiation</p>
                  <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg transform transition-all group-hover:scale-105">
                    ✨ Start Creating →
                  </div>
                </div>
              </Link>

              <Link 
                href="/memory-bank"
                onClick={onClose}
                className="group bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 backdrop-blur-sm rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-indigo-200 hover:border-indigo-300"
              >
                <div className="text-center">
                  <div className="text-4xl mb-3 group-hover:animate-pulse filter drop-shadow-lg">💎</div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Memory Bank</h3>
                  <p className="text-gray-700 text-sm mb-3 font-medium">Access your saved lessons and premium templates</p>
                  <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg transform transition-all group-hover:scale-105">
                    🗃️ Open Library →
                  </div>
                </div>
              </Link>

              <Link 
                href="/account-settings"
                onClick={onClose}
                className="group bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 backdrop-blur-sm rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-green-200 hover:border-green-300"
              >
                <div className="text-center">
                  <div className="text-4xl mb-3 group-hover:rotate-12 transition-transform filter drop-shadow-lg">⚙️</div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-2">Account Settings</h3>
                  <p className="text-gray-700 text-sm mb-3 font-medium">Manage subscription, billing, and preferences</p>
                  <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg transform transition-all group-hover:scale-105">
                    🎛️ Manage Account →
                  </div>
                </div>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-purple-100">
              <h3 className="text-md font-semibold text-gray-800 mb-3 text-center">📊 Your Teaching Impact</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-purple-600">∞</div>
                  <div className="text-xs text-gray-600">Lessons Available</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-indigo-600">5</div>
                  <div className="text-xs text-gray-600">Differentiation Levels</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-green-600">Pro</div>
                  <div className="text-xs text-gray-600">Account Status</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumDashboardModal;