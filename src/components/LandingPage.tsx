"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  ArrowRightIcon,
  ShieldCheckIcon,
  CubeIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  LockClosedIcon,
  GlobeAltIcon,
  CpuChipIcon,
  ServerIcon,
  BeakerIcon,
  DocumentTextIcon,
  LinkIcon,
  ArrowsRightLeftIcon,
  WalletIcon,
  CloudIcon,
  CodeBracketIcon,
  QrCodeIcon,
  DevicePhoneMobileIcon,
  ClipboardDocumentIcon,
  PlayIcon,
  PauseIcon,
} from "@heroicons/react/24/outline"

import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface LandingPageProps {
  onConnectWallet: () => void
  isWalletConnected: boolean
  onStartSwapping?: () => void
}

export default function LandingPage({ onConnectWallet, isWalletConnected, onStartSwapping }: LandingPageProps) {
  const [demoStep, setDemoStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [demoInterval, setDemoInterval] = useState<NodeJS.Timeout | null>(null)

  const heroRef = useRef<HTMLDivElement>(null)
  const demoRef = useRef<HTMLDivElement>(null)
  const flowRef = useRef<HTMLDivElement>(null)
  const qrCodeRef = useRef<HTMLDivElement>(null)
  const transferRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Hero section animations
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current.querySelectorAll(".hero-icon"),
        { scale: 0, rotation: -180 },
        { scale: 1, rotation: 0, duration: 1, stagger: 0.2, ease: "back.out(1.7)" },
      )

      gsap.fromTo(
        heroRef.current.querySelector(".hero-title"),
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, delay: 0.5, ease: "power3.out" },
      )
    }

    // Section headers animation
    gsap.utils.toArray(".section-header").forEach((element: any) => {
      gsap.fromTo(
        element,
        { y: 80, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        },
      )
    })

    // Cards and content blocks animation
    gsap.utils.toArray(".animate-card").forEach((element: any, index) => {
      gsap.fromTo(
        element,
        { y: 60, opacity: 0, rotationX: 15 },
        {
          y: 0,
          opacity: 1,
          rotationX: 0,
          duration: 0.8,
          delay: index * 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: element,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        },
      )
    })

    // Feature items stagger animation
    gsap.utils.toArray(".feature-item").forEach((element: any, index) => {
      gsap.fromTo(
        element,
        { x: index % 2 === 0 ? -50 : 50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          delay: index * 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: element,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        },
      )
    })

    // Stats counter animation
    gsap.utils.toArray(".stat-number").forEach((element: any) => {
      const finalValue = element.textContent
      gsap.fromTo(
        element,
        { textContent: 0, opacity: 0 },
        {
          textContent: finalValue,
          opacity: 1,
          duration: 2,
          ease: "power2.out",
          snap: { textContent: 1 },
          scrollTrigger: {
            trigger: element,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        },
      )
    })

    // Network cards with special effects
    gsap.utils.toArray(".network-card").forEach((element: any, index) => {
      gsap.fromTo(
        element,
        { scale: 0.8, opacity: 0, rotationY: 45 },
        {
          scale: 1,
          opacity: 1,
          rotationY: 0,
          duration: 1,
          delay: index * 0.2,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: element,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        },
      )
    })

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [])

  useEffect(() => {
    if (demoRef.current) {
      // Animate QR code generation with pulse effect
      if (demoStep >= 1 && qrCodeRef.current) {
        gsap.fromTo(
          qrCodeRef.current,
          { scale: 0, rotation: 360, opacity: 0 },
          { scale: 1, rotation: 0, opacity: 1, duration: 0.8, ease: "back.out(1.7)" },
        )

        // Add continuous pulse effect
        gsap.to(qrCodeRef.current, {
          scale: 1.1,
          duration: 1,
          repeat: -1,
          yoyo: true,
          ease: "power2.inOut",
        })
      }

      // Enhanced cross-chain transfer animation
      if (demoStep >= 4 && transferRef.current) {
        // Main rotation
        gsap.to(transferRef.current, {
          rotation: 360,
          duration: 2,
          repeat: -1,
          ease: "none",
        })

        // Scale pulsing
        gsap.to(transferRef.current, {
          scale: 1.2,
          duration: 1,
          repeat: -1,
          yoyo: true,
          ease: "power2.inOut",
        })
      }
    }
  }, [demoStep])

  const demoSteps = [
    {
      title: "CREATE PAYMENT REQUEST",
      description: "User creates a payment request for 100 RUSD to be sent cross-chain",
      details: "Amount: 100 RUSD | From: Base Sepolia | To: Avalanche Fuji",
    },
    {
      title: "GENERATE QR CODE & LINK",
      description: "System generates QR code and shareable payment link instantly",
      details: "QR Code Generated | Payment Link: pay.crosspay.io/xyz123",
    },
    {
      title: "RECIPIENT SCANS/CLICKS",
      description: "Recipient scans QR code or clicks payment link on any device",
      details: "Mobile/Desktop Compatible | One-Click Payment Experience",
    },
    {
      title: "WALLET CONNECTION",
      description: "Recipient connects wallet and confirms payment details",
      details: "MetaMask/WalletConnect | Auto-detects correct network",
    },
    {
      title: "CROSS-CHAIN EXECUTION",
      description: "OnlySwap solver executes cross-chain transfer automatically",
      details: "Solver Network Active | Escrow → Transfer → Verification",
    },
    {
      title: "PAYMENT COMPLETED",
      description: "Tokens received on destination chain, payment confirmed",
      details: "100 RUSD Received | Transaction Hash: 0xabc...def",
    },
  ]

  const startDemo = () => {
    if (demoInterval) clearInterval(demoInterval)
    setIsPlaying(true)
    setDemoStep(0)
    const interval = setInterval(() => {
      setDemoStep((prev) => {
        if (prev >= demoSteps.length - 1) {
          setIsPlaying(false)
          clearInterval(interval)
          setDemoInterval(null)
          return 0
        }
        return prev + 1
      })
    }, 3000)
    setDemoInterval(interval)
  }

  const stopDemo = () => {
    if (demoInterval) {
      clearInterval(demoInterval)
      setDemoInterval(null)
    }
    setIsPlaying(false)
    setDemoStep(0)
  }

  const goToStep = (stepIndex: number) => {
    if (demoInterval) {
      clearInterval(demoInterval)
      setDemoInterval(null)
    }
    setIsPlaying(false)
    setDemoStep(stepIndex)
  }

  return (
    <div className="min-h-screen">
      {/* Header - White Background */}
      <header className="bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-black rounded-none flex items-center justify-center">
                <CubeIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">CrossPay</h1>
                <p className="text-sm text-gray-600 font-mono">by Randamu</p>
              </div>
            </div>

            <Button
              onClick={onConnectWallet}
              className={`font-mono text-sm px-6 py-3 border-2 border-black ${
                isWalletConnected
                  ? "bg-black text-white hover:bg-gray-800"
                  : "bg-white text-black hover:bg-black hover:text-white"
              } transition-all duration-200`}
            >
              <WalletIcon className="w-4 h-4 mr-2" />
              {isWalletConnected ? "Wallet Connected" : "Connect Wallet"}
            </Button>
          </div>
        </div>
      </header>

      {/* Beta Notice - Black Background */}
      <div className="bg-black text-white border-b-4 border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center space-x-3">
            <BeakerIcon className="w-5 h-5" />
            <span className="text-sm font-mono font-bold">
              BETA VERSION - Base Sepolia & Avalanche Fuji Testnets Only - More Networks Coming Soon
            </span>
            <BeakerIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Hero Section - White Background */}
      <section className="bg-white text-black py-32" ref={heroRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-5xl mx-auto">
            <div className="mb-8">
              <div className="inline-flex items-center space-x-4 mb-6">
                <div className="hero-icon w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <QrCodeIcon className="w-10 h-10 text-white" />
                </div>
                <div className="hero-icon w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                  <LinkIcon className="w-10 h-10 text-white" />
                </div>
                <div className="hero-icon w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <ArrowsRightLeftIcon className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>

            <h1 className="hero-title text-6xl md:text-8xl font-black mb-8 text-balance leading-none">
              SINGLE-CLICK
              <span className="block">CROSS-CHAIN</span>
              <span className="block text-gray-600">PAYMENTS</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-700 mb-12 text-pretty max-w-4xl mx-auto leading-relaxed font-medium">
              CrossPay revolutionizes payments with QR codes and payment links. Send crypto across chains with just one
              click using our OnlySwap service. No bridges, no complexity - just instant cross-chain transfers.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Button
                size="lg"
                className="text-lg px-12 py-6 bg-black text-white hover:bg-gray-800 border-2 border-black font-bold"
                onClick={onStartSwapping || onConnectWallet}
              >
                <ArrowRightIcon className="w-6 h-6 mr-3" />
                START SWAPPING NOW
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-12 py-6 bg-white text-black border-2 border-black hover:bg-black hover:text-white font-bold"
              >
                <DocumentTextIcon className="w-6 h-6 mr-3" />
                VIEW DOCUMENTATION
              </Button>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              <div className="animate-card text-center p-6 border-2 border-black">
                <div className="stat-number text-4xl font-black mb-2">1</div>
                <div className="text-sm font-mono font-bold">CLICK PAYMENTS</div>
              </div>
              <div className="animate-card text-center p-6 border-2 border-black">
                <div className="text-4xl font-black mb-2">QR</div>
                <div className="text-sm font-mono font-bold">CODE SUPPORT</div>
              </div>
              <div className="animate-card text-center p-6 border-2 border-black">
                <div className="text-4xl font-black mb-2">&lt;60s</div>
                <div className="text-sm font-mono font-bold">PAYMENT TIME</div>
              </div>
              <div className="animate-card text-center p-6 border-2 border-black">
                <div className="stat-number text-4xl font-black mb-2">2</div>
                <div className="text-sm font-mono font-bold">SUPPORTED CHAINS</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Payment Demo - Black Background */}
      <section className="bg-black text-white py-32" ref={demoRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="section-header text-5xl md:text-6xl font-black mb-6">LIVE PAYMENT DEMO</h2>
            <p className="section-header text-xl text-gray-300 max-w-4xl mx-auto text-pretty font-medium mb-12">
              Watch how CrossPay enables seamless cross-chain payments through QR codes and payment links. Experience
              the complete flow from payment creation to cross-chain execution.
            </p>

            <div className="flex justify-center gap-4 mb-16">
              <Button
                onClick={startDemo}
                disabled={isPlaying}
                className="bg-white text-black hover:bg-gray-200 border-2 border-white font-bold px-8 py-4"
              >
                <PlayIcon className="w-5 h-5 mr-2" />
                START DEMO
              </Button>
              <Button
                onClick={stopDemo}
                className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-black font-bold px-8 py-4"
              >
                <PauseIcon className="w-5 h-5 mr-2" />
                RESET DEMO
              </Button>
            </div>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="border-4 border-white p-12 mb-12 relative overflow-hidden">
              {/* Background grid pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="grid grid-cols-12 grid-rows-8 h-full w-full">
                  {Array.from({ length: 96 }).map((_, i) => (
                    <div key={i} className="border border-white"></div>
                  ))}
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-8 items-center relative z-10">
                {/* Sender Side */}
                <div className="text-center">
                  <div
                    className={`w-32 h-32 border-4 border-white flex items-center justify-center mx-auto mb-6 transition-all duration-700 relative ${
                      demoStep >= 0 ? "bg-white text-black scale-110" : ""
                    } ${demoStep >= 1 ? "animate-pulse" : ""}`}
                  >
                    <WalletIcon className="w-16 h-16" />
                    {/* Connection lines */}
                    {demoStep >= 1 && (
                      <div className="absolute -right-8 top-1/2 w-16 h-0.5 bg-blue-400 animate-pulse"></div>
                    )}
                  </div>
                  <h3 className="text-2xl font-black mb-4">PAYMENT CREATOR</h3>
                  <div className="space-y-2 text-sm font-mono">
                    <div
                      className={`px-4 py-2 transition-all duration-500 ${
                        demoStep >= 0 ? "bg-blue-500 text-white" : "border border-white"
                      }`}
                    >
                      Base Sepolia
                    </div>
                    <div
                      className={`px-4 py-2 transition-all duration-500 ${
                        demoStep >= 0 ? "bg-white text-black" : "border border-white"
                      }`}
                    >
                      100 RUSD
                    </div>
                    <div
                      className={`px-4 py-2 transition-all duration-500 ${
                        demoStep >= 0 ? "bg-white text-black" : "border border-white"
                      }`}
                    >
                      Creates Request
                    </div>
                  </div>
                </div>

                {/* QR Code/Link Visualization */}
                <div className="text-center relative">
                  <div
                    ref={qrCodeRef}
                    className={`w-32 h-32 border-4 border-white flex items-center justify-center mx-auto mb-6 transition-all duration-700 relative ${
                      demoStep >= 1 ? "bg-green-500 text-white scale-110" : ""
                    } ${demoStep >= 2 ? "animate-pulse" : ""}`}
                  >
                    <QrCodeIcon className="w-16 h-16" />
                    {/* Scanning effect */}
                    {demoStep >= 2 && <div className="absolute inset-0 border-4 border-yellow-400 animate-ping"></div>}
                    {/* Connection lines */}
                    {demoStep >= 2 && (
                      <div className="absolute -right-8 top-1/2 w-16 h-0.5 bg-green-400 animate-pulse"></div>
                    )}
                  </div>
                  <h3 className="text-2xl font-black mb-4">QR CODE & LINK</h3>
                  <div className="space-y-2 text-sm font-mono">
                    <div
                      className={`px-4 py-2 transition-all duration-500 ${
                        demoStep >= 1 ? "bg-white text-black" : "border border-white"
                      }`}
                    >
                      QR Generated
                    </div>
                    <div
                      className={`px-4 py-2 transition-all duration-500 ${
                        demoStep >= 1 ? "bg-white text-black" : "border border-white"
                      }`}
                    >
                      Link Created
                    </div>
                    <div
                      className={`px-4 py-2 transition-all duration-500 ${
                        demoStep >= 2 ? "bg-white text-black" : "border border-white"
                      }`}
                    >
                      Recipient Scans
                    </div>
                  </div>
                </div>

                {/* Receiver Side */}
                <div className="text-center">
                  <div
                    className={`w-32 h-32 border-4 border-white flex items-center justify-center mx-auto mb-6 transition-all duration-700 relative ${
                      demoStep >= 3 ? "bg-white text-black scale-110" : ""
                    } ${demoStep >= 5 ? "animate-pulse" : ""}`}
                  >
                    <DevicePhoneMobileIcon className="w-16 h-16" />
                    {/* Success indicator */}
                    {demoStep >= 5 && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircleIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-2xl font-black mb-4">PAYMENT RECEIVER</h3>
                  <div className="space-y-2 text-sm font-mono">
                    <div
                      className={`px-4 py-2 transition-all duration-500 ${
                        demoStep >= 3 ? "bg-red-500 text-white" : "border border-white"
                      }`}
                    >
                      Avalanche Fuji
                    </div>
                    <div
                      className={`px-4 py-2 transition-all duration-500 ${
                        demoStep >= 3 ? "bg-white text-black" : "border border-white"
                      }`}
                    >
                      Wallet Connected
                    </div>
                    <div
                      className={`px-4 py-2 transition-all duration-500 ${
                        demoStep >= 5 ? "bg-green-500 text-white" : "border border-white"
                      }`}
                    >
                      100 RUSD Received
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Cross-Chain Flow Visualization */}
              <div className="mt-16 pt-16 border-t-4 border-white relative" ref={flowRef}>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div
                      className={`w-20 h-20 border-4 border-white flex items-center justify-center transition-all duration-700 relative ${
                        demoStep >= 4 ? "bg-blue-500 text-white scale-110" : ""
                      }`}
                    >
                      <span className="font-black text-lg">BASE</span>
                      {/* Outgoing transaction indicator */}
                      {demoStep >= 4 && (
                        <div className="absolute -right-2 -top-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                      )}
                    </div>
                    <p className="font-mono text-sm mt-2">Source Chain</p>
                  </div>

                  <div className="flex-1 flex items-center justify-center relative">
                    {/* Enhanced transfer visualization */}
                    <div
                      ref={transferRef}
                      className={`transition-all duration-1000 relative ${
                        demoStep >= 4 ? "text-yellow-400 scale-125" : "text-white"
                      }`}
                    >
                      <ArrowPathIcon className="w-16 h-16" />
                      {/* Orbital dots */}
                      {demoStep >= 4 && (
                        <>
                          <div
                            className="absolute inset-0 border-2 border-yellow-400 rounded-full animate-spin"
                            style={{ animationDuration: "3s" }}
                          ></div>
                          <div
                            className="absolute inset-2 border border-yellow-400 rounded-full animate-spin"
                            style={{ animationDuration: "2s", animationDirection: "reverse" }}
                          ></div>
                        </>
                      )}
                    </div>
                    {/* Animated transfer particles */}
                    {demoStep >= 4 && (
                      <div className="absolute flex space-x-2">
                        <div
                          className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                    )}
                    {/* Progress bar */}
                    {demoStep >= 4 && (
                      <div className="absolute -bottom-8 left-0 right-0 h-1 bg-gray-700 rounded">
                        <div
                          className="h-full bg-yellow-400 rounded animate-pulse"
                          style={{ width: `${((demoStep - 3) / 3) * 100}%` }}
                        ></div>
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <div
                      className={`w-20 h-20 border-4 border-white flex items-center justify-center transition-all duration-700 relative ${
                        demoStep >= 5 ? "bg-red-500 text-white scale-110" : ""
                      }`}
                    >
                      <span className="font-black text-lg">AVAX</span>
                      {/* Incoming transaction indicator */}
                      {demoStep >= 5 && (
                        <div className="absolute -right-2 -top-2 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
                      )}
                    </div>
                    <p className="font-mono text-sm mt-2">Destination Chain</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Step Display */}
            <div className="bg-white text-black p-8 border-4 border-white mb-8 relative overflow-hidden">
              {/* Progress indicator */}
              <div
                className="absolute top-0 left-0 h-1 bg-black transition-all duration-500"
                style={{ width: `${((demoStep + 1) / demoSteps.length) * 100}%` }}
              ></div>

              <div className="text-center">
                <h3 className="text-3xl font-black mb-4">
                  STEP {demoStep + 1}: {demoSteps[demoStep].title}
                </h3>
                <p className="text-xl font-medium mb-6">{demoSteps[demoStep].description}</p>
                <div className="bg-black text-white px-6 py-3 font-mono text-sm inline-block">
                  {demoSteps[demoStep].details}
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-12 space-x-4">
              {demoSteps.map((step, index) => (
                <button
                  key={index}
                  onClick={() => goToStep(index)}
                  className={`w-6 h-6 border-2 border-white transition-all duration-300 hover:scale-110 relative ${
                    index <= demoStep ? "bg-white" : ""
                  } ${index === demoStep ? "ring-2 ring-white ring-offset-2 ring-offset-black" : ""}`}
                  title={`Go to Step ${index + 1}: ${step.title}`}
                >
                  {index < demoStep && <CheckCircleIcon className="w-4 h-4 text-black absolute inset-0 m-auto" />}
                </button>
              ))}
            </div>

            <div className="flex justify-center mt-8 space-x-4">
              <Button
                onClick={() => goToStep(Math.max(0, demoStep - 1))}
                disabled={demoStep === 0}
                className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-black font-bold px-6 py-3 disabled:opacity-50"
              >
                ← PREVIOUS STEP
              </Button>
              <Button
                onClick={() => goToStep(Math.min(demoSteps.length - 1, demoStep + 1))}
                disabled={demoStep === demoSteps.length - 1}
                className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-black font-bold px-6 py-3 disabled:opacity-50"
              >
                NEXT STEP →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* QR Code & Link Payment Features - White Background */}
      <section className="bg-white text-black py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="section-header text-5xl md:text-6xl font-black mb-6">QR CODE & LINK PAYMENTS</h2>
            <p className="section-header text-xl text-gray-700 max-w-4xl mx-auto text-pretty font-medium">
              Revolutionary payment experience that makes cross-chain transfers as simple as scanning a QR code or
              clicking a link
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 max-w-6xl mx-auto">
            {/* QR Code Payments */}
            <div className="animate-card border-4 border-black p-12">
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-black text-white flex items-center justify-center mx-auto mb-6">
                  <QrCodeIcon className="w-14 h-14" />
                </div>
                <h3 className="text-3xl font-black mb-4">QR CODE PAYMENTS</h3>
                <p className="text-gray-600 font-medium">Instant cross-chain payments through QR code scanning</p>
              </div>

              <div className="space-y-6">
                <div className="feature-item flex items-start space-x-4">
                  <div className="w-8 h-8 bg-black text-white flex items-center justify-center flex-shrink-0 font-black">
                    1
                  </div>
                  <div>
                    <h4 className="font-black mb-2">GENERATE QR CODE</h4>
                    <p className="text-sm font-medium text-gray-700">
                      Create payment request with amount, source chain, and destination chain. System instantly
                      generates unique QR code.
                    </p>
                  </div>
                </div>

                <div className="feature-item flex items-start space-x-4">
                  <div className="w-8 h-8 bg-black text-white flex items-center justify-center flex-shrink-0 font-black">
                    2
                  </div>
                  <div>
                    <h4 className="font-black mb-2">SCAN & PAY</h4>
                    <p className="text-sm font-medium text-gray-700">
                      Recipient scans QR code with any device, connects wallet, and confirms payment with single click.
                    </p>
                  </div>
                </div>

                <div className="feature-item flex items-start space-x-4">
                  <div className="w-8 h-8 bg-black text-white flex items-center justify-center flex-shrink-0 font-black">
                    3
                  </div>
                  <div>
                    <h4 className="font-black mb-2">CROSS-CHAIN EXECUTION</h4>
                    <p className="text-sm font-medium text-gray-700">
                      OnlySwap solver network executes cross-chain transfer automatically. Tokens delivered to
                      destination chain.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gray-100">
                <h4 className="font-black mb-4">QR CODE FEATURES</h4>
                <ul className="space-y-2 text-sm font-medium">
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    <span>Works on any mobile device or desktop</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    <span>No app installation required</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    <span>Secure encrypted payment data</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    <span>Real-time payment status updates</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Payment Links */}
            <div className="animate-card border-4 border-black p-12">
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-black text-white flex items-center justify-center mx-auto mb-6">
                  <LinkIcon className="w-14 h-14" />
                </div>
                <h3 className="text-3xl font-black mb-4">PAYMENT LINKS</h3>
                <p className="text-gray-600 font-medium">Shareable links for seamless cross-chain payments</p>
              </div>

              <div className="space-y-6">
                <div className="feature-item flex items-start space-x-4">
                  <div className="w-8 h-8 bg-black text-white flex items-center justify-center flex-shrink-0 font-black">
                    1
                  </div>
                  <div>
                    <h4 className="font-black mb-2">CREATE PAYMENT LINK</h4>
                    <p className="text-sm font-medium text-gray-700">
                      Generate shareable payment link with embedded payment details. Copy and share via any platform.
                    </p>
                  </div>
                </div>

                <div className="feature-item flex items-start space-x-4">
                  <div className="w-8 h-8 bg-black text-white flex items-center justify-center flex-shrink-0 font-black">
                    2
                  </div>
                  <div>
                    <h4 className="font-black mb-2">CLICK & CONNECT</h4>
                    <p className="text-sm font-medium text-gray-700">
                      Recipient clicks link, automatically redirected to payment interface with pre-filled details.
                    </p>
                  </div>
                </div>

                <div className="feature-item flex items-start space-x-4">
                  <div className="w-8 h-8 bg-black text-white flex items-center justify-center flex-shrink-0 font-black">
                    3
                  </div>
                  <div>
                    <h4 className="font-black mb-2">INSTANT TRANSFER</h4>
                    <p className="text-sm font-medium text-gray-700">
                      One-click wallet connection and payment confirmation. Cross-chain transfer executed immediately.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gray-100">
                <h4 className="font-black mb-4">PAYMENT LINK FEATURES</h4>
                <ul className="space-y-2 text-sm font-medium">
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    <span>Share via email, SMS, social media</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    <span>Custom expiration times</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    <span>Payment tracking and notifications</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    <span>Multi-device compatibility</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Use Cases */}
          <div className="mt-20">
            <h3 className="section-header text-4xl font-black text-center mb-12">PAYMENT USE CASES</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="animate-card text-center p-8 border-2 border-black">
                <ClipboardDocumentIcon className="w-16 h-16 mx-auto mb-6" />
                <h4 className="text-xl font-black mb-4">INVOICE PAYMENTS</h4>
                <p className="text-sm font-medium text-gray-700">
                  Generate QR codes for invoices. Customers pay instantly across chains without manual address entry.
                </p>
              </div>

              <div className="animate-card text-center p-8 border-2 border-black">
                <DevicePhoneMobileIcon className="w-16 h-16 mx-auto mb-6" />
                <h4 className="text-xl font-black mb-4">PEER-TO-PEER</h4>
                <p className="text-sm font-medium text-gray-700">
                  Send payment links to friends and family. Cross-chain transfers made as simple as sending a text
                  message.
                </p>
              </div>

              <div className="animate-card text-center p-8 border-2 border-black">
                <GlobeAltIcon className="w-16 h-16 mx-auto mb-6" />
                <h4 className="text-xl font-black mb-4">E-COMMERCE</h4>
                <p className="text-sm font-medium text-gray-700">
                  Integrate payment links into online stores. Accept cross-chain payments with zero technical
                  complexity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Black Background */}
      <section className="bg-black text-white py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="section-header text-5xl md:text-6xl font-black mb-6">HOW IT WORKS</h2>
            <p className="section-header text-xl text-gray-300 max-w-4xl mx-auto text-pretty font-medium">
              Our revolutionary OnlySwap service uses solver-based architecture to eliminate traditional bridge
              vulnerabilities while providing faster, more secure cross-chain token transfers.
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8 mb-16">
            <div className="animate-card bg-white text-black p-8 border-4 border-white relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-black text-white flex items-center justify-center font-black text-xl">
                1
              </div>
              <WalletIcon className="w-12 h-12 mb-6" />
              <h3 className="text-xl font-black mb-4">INITIATE REQUEST</h3>
              <p className="text-sm font-medium leading-relaxed">
                User connects wallet and specifies cross-chain swap parameters including source network, destination
                network, token amount, and recipient address.
              </p>
              <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 hidden lg:block">
                <ArrowRightIcon className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="animate-card bg-white text-black p-8 border-4 border-white relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-black text-white flex items-center justify-center font-black text-xl">
                2
              </div>
              <LockClosedIcon className="w-12 h-12 mb-6" />
              <h3 className="text-xl font-black mb-4">SECURE ESCROW</h3>
              <p className="text-sm font-medium leading-relaxed">
                Smart contract locks tokens in secure escrow on source chain with cryptographic proof. Funds remain
                protected until destination transaction is verified.
              </p>
              <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 hidden lg:block">
                <ArrowRightIcon className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="animate-card bg-white text-black p-8 border-4 border-white relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-black text-white flex items-center justify-center font-black text-xl">
                3
              </div>
              <CpuChipIcon className="w-12 h-12 mb-6" />
              <h3 className="text-xl font-black mb-4">SOLVER EXECUTION</h3>
              <p className="text-sm font-medium leading-relaxed">
                Network solvers detect escrow event and execute corresponding transaction on destination chain. Multiple
                solvers compete for optimal execution.
              </p>
              <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 hidden lg:block">
                <ArrowRightIcon className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="animate-card bg-white text-black p-8 border-4 border-white">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-black text-white flex items-center justify-center font-black text-xl">
                4
              </div>
              <CheckCircleIcon className="w-12 h-12 mb-6" />
              <h3 className="text-xl font-black mb-4">RECEIVE TOKENS</h3>
              <p className="text-sm font-medium leading-relaxed">
                User receives tokens on destination chain. Escrow is released upon successful verification. Complete
                cross-chain transfer without bridge risks.
              </p>
            </div>
          </div>

          {/* Flow Diagram */}
          <div className="animate-card border-4 border-white p-12">
            <h3 className="text-3xl font-black text-center mb-12">TECHNICAL FLOW DIAGRAM</h3>
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-8 lg:space-y-0 lg:space-x-8">
              <div className="text-center">
                <div className="w-24 h-24 border-4 border-white flex items-center justify-center mb-4">
                  <span className="font-black text-2xl">BASE</span>
                </div>
                <p className="font-mono text-sm">Source Chain</p>
              </div>

              <div className="flex flex-col items-center">
                <ArrowPathIcon className="w-16 h-16 mb-4" />
                <p className="font-mono text-sm text-center">
                  SOLVER
                  <br />
                  NETWORK
                </p>
              </div>

              <div className="text-center">
                <div className="w-24 h-24 border-4 border-white flex items-center justify-center mb-4">
                  <span className="font-black text-2xl">AVAX</span>
                </div>
                <p className="font-mono text-sm">Destination Chain</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Networks - White Background */}
      <section className="bg-white text-black py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="section-header text-5xl md:text-6xl font-black mb-6">SUPPORTED NETWORKS</h2>
            <p className="section-header text-xl text-gray-700 font-medium">
              Currently available on testnet environments with mainnet coming soon
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="network-card border-4 border-black p-8">
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-black text-white flex items-center justify-center mx-auto mb-6">
                  <span className="font-black text-3xl">B</span>
                </div>
                <h3 className="text-3xl font-black mb-2">BASE SEPOLIA</h3>
                <p className="text-gray-600 font-medium">Ethereum Layer 2 Testnet</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-300">
                  <span className="font-bold">Chain ID:</span>
                  <span className="font-mono bg-black text-white px-3 py-1">84532</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-300">
                  <span className="font-bold">Token Symbol:</span>
                  <span className="font-mono bg-black text-white px-3 py-1">RUSD</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-300">
                  <span className="font-bold">Decimals:</span>
                  <span className="font-mono bg-black text-white px-3 py-1">18</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-300">
                  <span className="font-bold">Block Time:</span>
                  <span className="font-mono bg-black text-white px-3 py-1">~2s</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="font-bold">Gas Token:</span>
                  <span className="font-mono bg-black text-white px-3 py-1">ETH</span>
                </div>
              </div>

              <div className="mt-8 p-4 bg-gray-100">
                <h4 className="font-black mb-3">NETWORK FEATURES</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    <span>Low transaction fees</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    <span>Fast block confirmation</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    <span>Ethereum compatibility</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="network-card border-4 border-black p-8">
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-black text-white flex items-center justify-center mx-auto mb-6">
                  <span className="font-black text-3xl">A</span>
                </div>
                <h3 className="text-3xl font-black mb-2">AVALANCHE FUJI</h3>
                <p className="text-gray-600 font-medium">Avalanche C-Chain Testnet</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-300">
                  <span className="font-bold">Chain ID:</span>
                  <span className="font-mono bg-black text-white px-3 py-1">43113</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-300">
                  <span className="font-bold">Token Symbol:</span>
                  <span className="font-mono bg-black text-white px-3 py-1">RUSD</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-300">
                  <span className="font-bold">Decimals:</span>
                  <span className="font-mono bg-black text-white px-3 py-1">18</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-300">
                  <span className="font-bold">Block Time:</span>
                  <span className="font-mono bg-black text-white px-3 py-1">~2s</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="font-bold">Gas Token:</span>
                  <span className="font-mono bg-black text-white px-3 py-1">AVAX</span>
                </div>
              </div>

              <div className="mt-8 p-4 bg-gray-100">
                <h4 className="font-black mb-3">NETWORK FEATURES</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    <span>Sub-second finality</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    <span>High throughput capacity</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    <span>EVM compatible</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Specifications - Black Background */}
      <section className="bg-black text-white py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="section-header text-5xl md:text-6xl font-black mb-6">TECHNICAL SPECIFICATIONS</h2>
            <p className="section-header text-xl text-gray-300 font-medium">
              Built on proven smart contract infrastructure with enterprise-grade security
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="animate-card bg-white text-black p-8 border-4 border-white">
              <ShieldCheckIcon className="w-16 h-16 mb-6" />
              <h3 className="text-2xl font-black mb-6">SECURITY ARCHITECTURE</h3>
              <ul className="space-y-4 text-sm font-medium">
                <li className="feature-item flex items-start">
                  <CheckCircleIcon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Multi-signature smart contract validation with time-locked escrow mechanisms</span>
                </li>
                <li className="feature-item flex items-start">
                  <CheckCircleIcon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Cryptographic proof verification for all cross-chain transactions</span>
                </li>
                <li className="feature-item flex items-start">
                  <CheckCircleIcon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Automated slashing conditions for malicious solver behavior</span>
                </li>
                <li className="feature-item flex items-start">
                  <CheckCircleIcon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Emergency pause functionality with governance controls</span>
                </li>
              </ul>
            </div>

            <div className="animate-card bg-white text-black p-8 border-4 border-white">
              <BoltIcon className="w-16 h-16 mb-6" />
              <h3 className="text-2xl font-black mb-6">PERFORMANCE METRICS</h3>
              <ul className="space-y-4 text-sm font-medium">
                <li className="feature-item flex items-start">
                  <CheckCircleIcon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Average swap completion time under 60 seconds across all networks</span>
                </li>
                <li className="feature-item flex items-start">
                  <CheckCircleIcon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Gas optimization reducing transaction costs by up to 40%</span>
                </li>
                <li className="feature-item flex items-start">
                  <CheckCircleIcon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Throughput capacity of 1000+ concurrent swap operations</span>
                </li>
                <li className="feature-item flex items-start">
                  <CheckCircleIcon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Real-time transaction status monitoring and notifications</span>
                </li>
              </ul>
            </div>

            <div className="animate-card bg-white text-black p-8 border-4 border-white">
              <ServerIcon className="w-16 h-16 mb-6" />
              <h3 className="text-2xl font-black mb-6">INFRASTRUCTURE</h3>
              <ul className="space-y-4 text-sm font-medium">
                <li className="feature-item flex items-start">
                  <CheckCircleIcon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Distributed solver network with redundant execution paths</span>
                </li>
                <li className="feature-item flex items-start">
                  <CheckCircleIcon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span>99.9% uptime guarantee with automatic failover mechanisms</span>
                </li>
                <li className="feature-item flex items-start">
                  <CheckCircleIcon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Comprehensive logging and analytics for all transactions</span>
                </li>
                <li className="feature-item flex items-start">
                  <CheckCircleIcon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span>API endpoints for integration with external applications</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* RUSD Token Information - White Background */}
      <section className="bg-white text-black py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="section-header text-5xl md:text-6xl font-black mb-6">RUSD TOKEN</h2>
            <p className="section-header text-xl text-gray-700 font-medium">
              Testnet token powering cross-chain operations on CrossPay
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="animate-card border-4 border-black p-12">
              <div className="grid lg:grid-cols-2 gap-12">
                <div>
                  <div className="text-center mb-8">
                    <div className="w-32 h-32 bg-black text-white flex items-center justify-center mx-auto mb-6">
                      <span className="font-black text-4xl">RUSD</span>
                    </div>
                    <h3 className="text-3xl font-black mb-2">RANDAMU USD</h3>
                    <p className="text-gray-600 font-medium">ERC-20 Compatible Testnet Token</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-4 border-b-2 border-gray-300">
                      <span className="font-bold text-lg">Token Symbol:</span>
                      <span className="font-mono bg-black text-white px-4 py-2 text-lg">RUSD</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b-2 border-gray-300">
                      <span className="font-bold text-lg">Decimals:</span>
                      <span className="font-mono bg-black text-white px-4 py-2 text-lg">18</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b-2 border-gray-300">
                      <span className="font-bold text-lg">Token Standard:</span>
                      <span className="font-mono bg-black text-white px-4 py-2 text-lg">ERC-20</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b-2 border-gray-300">
                      <span className="font-bold text-lg">Network Support:</span>
                      <span className="font-mono bg-black text-white px-4 py-2 text-lg">Multi-Chain</span>
                    </div>
                    <div className="flex justify-between items-center py-4">
                      <span className="font-bold text-lg">Purpose:</span>
                      <span className="font-mono bg-black text-white px-4 py-2 text-lg">Testing Only</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-2xl font-black mb-8">TOKEN FEATURES & AVAILABILITY</h4>

                  <div className="space-y-6">
                    <div className="feature-item p-6 bg-gray-100 border-2 border-gray-300">
                      <h5 className="font-black mb-4 flex items-center">
                        <CloudIcon className="w-6 h-6 mr-3" />
                        FAUCET AVAILABILITY
                      </h5>
                      <ul className="space-y-2 text-sm font-medium">
                        <li className="flex items-center">
                          <CheckCircleIcon className="w-4 h-4 mr-2" />
                          <span>Free distribution from testnet faucets</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircleIcon className="w-4 h-4 mr-2" />
                          <span>Daily claim limits to prevent abuse</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircleIcon className="w-4 h-4 mr-2" />
                          <span>Available on both supported networks</span>
                        </li>
                      </ul>
                    </div>

                    <div className="feature-item p-6 bg-gray-100 border-2 border-gray-300">
                      <h5 className="font-black mb-4 flex items-center">
                        <CodeBracketIcon className="w-6 h-6 mr-3" />
                        TECHNICAL SPECIFICATIONS
                      </h5>
                      <ul className="space-y-2 text-sm font-medium">
                        <li className="flex items-center">
                          <CheckCircleIcon className="w-4 h-4 mr-2" />
                          <span>Standard ERC-20 implementation</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircleIcon className="w-4 h-4 mr-2" />
                          <span>Cross-chain compatible architecture</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircleIcon className="w-4 h-4 mr-2" />
                          <span>Optimized for low gas consumption</span>
                        </li>
                      </ul>
                    </div>

                    <div className="p-6 bg-black text-white">
                      <h5 className="font-black mb-4 flex items-center">
                        <ExclamationTriangleIcon className="w-6 h-6 mr-3" />
                        IMPORTANT NOTICE
                      </h5>
                      <p className="text-sm font-medium">
                        RUSD tokens have no monetary value and are intended solely for testing purposes. Do not attempt
                        to trade or assign real-world value to these tokens.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Black Background */}
      <footer className="bg-black text-white py-16 border-t-4 border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-8">
              <div className="w-16 h-16 bg-white text-black flex items-center justify-center">
                <CubeIcon className="w-10 h-10" />
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-black">CrossPay</h3>
                <p className="text-sm font-mono text-gray-400">by Randamu</p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className="bg-white text-black px-6 py-3 font-mono font-bold">BASE SEPOLIA: 84532</div>
              <div className="bg-white text-black px-6 py-3 font-mono font-bold">AVALANCHE FUJI: 43113</div>
            </div>

            <div className="max-w-4xl mx-auto mb-8">
              <p className="text-lg font-medium leading-relaxed">
                CrossPay is currently in beta testing phase with the OnlySwap service supporting testnet environments
                only. Additional networks, mainnet support, and advanced features will be rolled out in future releases.
                This is experimental software - use at your own risk.
              </p>
            </div>

            <div className="border-t-2 border-white pt-8">
              <p className="text-sm font-mono text-gray-400">
                © 2025 Randamu. All rights reserved. | Built with advanced solver technology.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
