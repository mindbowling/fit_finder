'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
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

  const aspectRatio = 1600 / 2000
  const baseImageWidth = 200
  const baseImageHeight = baseImageWidth / aspectRatio

  const calculateGridSize = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth
      const isMobile = containerWidth <= 768 // Adjust this breakpoint as needed
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

  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    const item = items.find(i => i.id === itemId)
    if (item) {
      setDraggedItem(itemId)
      setDragOffset({
        x: e.clientX - item.x,
        y: e.clientY - item.y
      })
      bringToFront(itemId)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedItem) {
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === draggedItem
            ? { ...item, x: newX, y: newY }
            : item
        )
      )
    }
  }

  const handleMouseUp = () => {
    setDraggedItem(null)
  }

  const handleTouchStart = (e: React.TouchEvent, itemId: string) => {
    const item = items.find(i => i.id === itemId)
    if (item) {
      setDraggedItem(itemId)
      const touch = e.touches[0]
      setDragOffset({
        x: touch.clientX - item.x,
        y: touch.clientY - item.y
      })
      bringToFront(itemId)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggedItem) {
      e.preventDefault() // Prevent scrolling while dragging
      const touch = e.touches[0]
      const newX = touch.clientX - dragOffset.x
      const newY = touch.clientY - dragOffset.y
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === draggedItem
            ? { ...item, x: newX, y: newY }
            : item
        )
      )
    }
  }

  const handleTouchEnd = () => {
    setDraggedItem(null)
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
        <h1 className="text-sm text-center text-black-800">
          Drag and reposition to create your fit.
        </h1>
      </header>
      <div 
        ref={containerRef} 
        className="flex-grow p-4 overflow-auto touch-none" 
        style={{ width: '100vw', height: 'calc(100vh - 123px)' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
              onMouseDown={(e) => handleMouseDown(e, item.id)}
              onTouchStart={(e) => handleTouchStart(e, item.id)}
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