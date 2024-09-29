'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Move, Lock } from 'lucide-react'
import imageList from '../src/utils/imageList.json'

interface GridItem {
  id: string
  x: number
  y: number
  width: number
  height: number
  img: string
  zIndex: number
}

export default function InfiniteImageGrid() {
  const [items, setItems] = useState<GridItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [maxZIndex, setMaxZIndex] = useState(0)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isMobile, setIsMobile] = useState(false)
  const [isLocked, setIsLocked] = useState(false)

  const aspectRatio = 1600 / 2000
  const baseImageWidth = 200
  const baseImageHeight = baseImageWidth / aspectRatio

  const calculateGridSize = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth
      const isMobile = containerWidth <= 768
      setIsMobile(isMobile)
      const columns = isMobile ? 3 : Math.floor(containerWidth / (baseImageWidth + 20))
      const imageWidth = (containerWidth - (columns + 1) * 20) / columns
      const imageHeight = imageWidth / aspectRatio
      const rows = Math.ceil(imageList.length / columns)
      return {
        width: containerWidth,
        height: rows * (imageHeight + 20),
        columns,
        imageWidth,
        imageHeight,
        isMobile
      }
    }
    return { width: 0, height: 0, columns: 0, imageWidth: 0, imageHeight: 0, isMobile: false }
  }, [])

  const loadAllItems = useCallback(() => {
    const { columns, imageWidth, imageHeight, isMobile } = calculateGridSize()
    const newItems: GridItem[] = imageList.map((img, i) => ({
      id: i.toString(),
      x: (i % columns) * (imageWidth + (isMobile ? 10 : 20)) + (isMobile ? 5 : 10),
      y: Math.floor(i / columns) * (imageHeight + (isMobile ? 10 : 20)) + (isMobile ? 5 : 10),
      width: imageWidth,
      height: imageHeight,
      img: `/productImages/${img}`,
      zIndex: 0
    }))
    setItems(newItems)
  }, [calculateGridSize])

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const newSize = calculateGridSize()
        setContainerSize(newSize)
        loadAllItems()
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [calculateGridSize, loadAllItems])

  const bringToFront = (itemId: string) => {
    const newMaxZIndex = maxZIndex + 1
    setMaxZIndex(newMaxZIndex)
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, zIndex: newMaxZIndex } 
          : item
      )
    )
  }

  const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent, itemId: string) => {
    if (isMobile && isLocked) return

    const item = items.find(i => i.id === itemId)
    if (item) {
      setDraggedItem(itemId)
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      setDragOffset({
        x: clientX - item.x,
        y: clientY - item.y
      })
      bringToFront(itemId)
    }
  }

  const handleInteractionMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (draggedItem) {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      const newX = clientX - dragOffset.x
      const newY = clientY - dragOffset.y
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === draggedItem
            ? { ...item, x: newX, y: newY }
            : item
        )
      )
    }
  }

  const handleInteractionEnd = () => {
    setDraggedItem(null)
  }

  const toggleLock = () => {
    setIsLocked(!isLocked)
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  return (
    <div className="flex flex-col min-h-screen bg-white-100">
      <header className="bg-white py-6 flex flex-col items-center">
        <Link href="https://www.mind-bowling.com/" target="_blank" rel="noopener noreferrer">
          <Image
            src="/logos/logo.png"
            alt="Logo"
            width={100}
            height={100}
            className="mb-2"
          />
        </Link>
        <h1 className="text-sm text-center text-black-800 px-4">
          {isMobile
            ? "Drag and reposition to create your fit. Unlock to reposition and lock to scroll."
            : "Drag and reposition to create your fit."}
        </h1>
      </header>
      {isMobile && (
        <button
          onClick={toggleLock}
          className="fixed bottom-4 right-4 z-50 bg-blue-500 text-white p-2 rounded-full shadow-lg"
        >
          {isLocked ? <Lock size={24} /> : <Move size={24} />}
        </button>
      )}
      <div 
        ref={containerRef} 
        className={`flex-grow p-4 overflow-auto ${!isLocked ? 'touch-none' : ''}`}
        style={{ width: '100vw', height: 'calc(100vh - 123px)' }}
        onMouseMove={handleInteractionMove}
        onMouseUp={handleInteractionEnd}
        onTouchMove={handleInteractionMove}
        onTouchEnd={handleInteractionEnd}
      >
        <div style={{ position: 'relative', width: containerSize.width, height: containerSize.height }}>
          {items.map((item) => (
            <div 
              key={item.id} 
              className="absolute rounded-lg overflow-hidden cursor-move transition-shadow duration-300 hover:shadow-xl"
              style={{
                left: item.x,
                top: item.y,
                width: item.width,
                height: item.height,
                zIndex: item.zIndex
              }}
              onMouseDown={(e) => handleInteractionStart(e, item.id)}
              onTouchStart={(e) => handleInteractionStart(e, item.id)}
            >
              <Image
                src={item.img}
                alt={`Product Image ${parseInt(item.id) + 1}`}
                width={1600}
                height={2000}
                className="w-full h-full object-cover"
                onError={() => setError(`Failed to load image ${item.id}`)}
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}