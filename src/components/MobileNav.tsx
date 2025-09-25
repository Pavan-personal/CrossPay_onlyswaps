import { Link, useLocation } from 'react-router-dom'
import {
  XMarkIcon,
  ArrowPathIcon,
  PlusIcon,
  PaperAirplaneIcon,
  LinkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

const navItems = [
  { path: '/swap', icon: ArrowPathIcon, label: 'Swap' },
  { path: '/create', icon: PlusIcon, label: 'Create Payment' },
  { path: '/send', icon: PaperAirplaneIcon, label: 'Send' },
  { path: '/payments', icon: LinkIcon, label: 'Payments' },
  { path: '/history', icon: ClockIcon, label: 'History' },
]

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const location = useLocation()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Mobile Menu */}
      <div className="relative bg-white h-full w-80 max-w-sm shadow-xl border-r-2 border-black">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-black">CrossPay</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-black text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
