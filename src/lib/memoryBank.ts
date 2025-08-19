// Memory Bank Storage and Management
// Handles automatic lesson saving and retrieval

import { ActivityNode } from '../types/memoryBank'

export interface VideoData {
  id: string
  title: string
  description?: string
  url?: string
}

interface DifferentiationData {
  type: string
  level: string
  modifications: string[]
}

interface LessonSaveData {
  title: string
  subject: string
  gradeLevel: string
  topic: string
  activityType: string
  duration: number
  content: string
  selectedVideos?: VideoData[]
  differentiationApplied?: DifferentiationData
  userEmail?: string
}

// Memory Bank Storage Service
export class MemoryBankService {
  private static STORAGE_KEY = 'lesson_plan_memory_bank'
  
  // Save a lesson to the memory bank
  static async saveLesson(lessonData: LessonSaveData): Promise<string> {
    try {
      const activityId = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const activityNode: ActivityNode = {
        id: activityId,
        title: lessonData.title || `${lessonData.subject} - ${lessonData.topic}`,
        subject: lessonData.subject,
        gradeLevel: lessonData.gradeLevel,
        topic: lessonData.topic,
        activityType: lessonData.activityType,
        duration: lessonData.duration,
        rating: 0, // Initial rating
        useCount: 1,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        preview: MemoryBankService.generatePreview(lessonData.content),
        tags: MemoryBankService.generateTags(lessonData),
        isFavorite: false,
        mode: 'teacher',
        fullContent: lessonData.content,
        templateUseCount: 0,
        successScore: 0,
        userEmail: lessonData.userEmail,
        selectedVideos: lessonData.selectedVideos || [],
        differentiationApplied: lessonData.differentiationApplied
      }
      
      // Get existing lessons
      const existingLessons = MemoryBankService.getAllLessons()
      
      // Add new lesson
      existingLessons.unshift(activityNode) // Add to beginning
      
      // Limit storage to 100 lessons for performance
      const lessonsToStore = existingLessons.slice(0, 100)
      
      // Save to localStorage
      localStorage.setItem(MemoryBankService.STORAGE_KEY, JSON.stringify(lessonsToStore))
      
      console.log('✅ Lesson saved to Memory Bank:', activityNode.title)
      return activityId
      
    } catch (error) {
      console.error('❌ Failed to save lesson to Memory Bank:', error)
      throw new Error('Failed to save lesson')
    }
  }
  
  // Get all lessons from memory bank
  static getAllLessons(): ActivityNode[] {
    try {
      const stored = localStorage.getItem(MemoryBankService.STORAGE_KEY)
      if (!stored) return []
      
      const lessons = JSON.parse(stored) as ActivityNode[]
      return lessons || []
    } catch (error) {
      console.error('❌ Failed to retrieve lessons from Memory Bank:', error)
      return []
    }
  }
  
  // Get lessons for specific user (filtered by email)
  static getLessonsForUser(userEmail: string): ActivityNode[] {
    const allLessons = MemoryBankService.getAllLessons()
    return allLessons.filter(lesson => 
      lesson.userEmail === userEmail || 
      !lesson.userEmail // Include legacy lessons without email
    )
  }
  
  // Update lesson (increment use count, update last used)
  static updateLessonUsage(lessonId: string): void {
    try {
      const lessons = MemoryBankService.getAllLessons()
      const lessonIndex = lessons.findIndex(l => l.id === lessonId)
      
      if (lessonIndex >= 0) {
        lessons[lessonIndex].useCount += 1
        lessons[lessonIndex].lastUsed = new Date().toISOString()
        
        localStorage.setItem(MemoryBankService.STORAGE_KEY, JSON.stringify(lessons))
        console.log('✅ Updated lesson usage:', lessons[lessonIndex].title)
      }
    } catch (error) {
      console.error('❌ Failed to update lesson usage:', error)
    }
  }
  
  // Delete lesson
  static deleteLesson(lessonId: string): void {
    try {
      const lessons = MemoryBankService.getAllLessons()
      const filteredLessons = lessons.filter(l => l.id !== lessonId)
      
      localStorage.setItem(MemoryBankService.STORAGE_KEY, JSON.stringify(filteredLessons))
      console.log('✅ Deleted lesson from Memory Bank:', lessonId)
    } catch (error) {
      console.error('❌ Failed to delete lesson:', error)
    }
  }
  
  // Toggle favorite status
  static toggleFavorite(lessonId: string): void {
    try {
      const lessons = MemoryBankService.getAllLessons()
      const lessonIndex = lessons.findIndex(l => l.id === lessonId)
      
      if (lessonIndex >= 0) {
        lessons[lessonIndex].isFavorite = !lessons[lessonIndex].isFavorite
        localStorage.setItem(MemoryBankService.STORAGE_KEY, JSON.stringify(lessons))
        console.log('✅ Toggled favorite status:', lessons[lessonIndex].title)
      }
    } catch (error) {
      console.error('❌ Failed to toggle favorite:', error)
    }
  }
  
  // Helper: Generate preview text from content
  private static generatePreview(content: string): string {
    if (!content) return 'No preview available'
    
    // Remove markdown formatting and get first meaningful sentence
    const cleanContent = content
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim()
    
    // Get first 150 characters
    const preview = cleanContent.substring(0, 150)
    return preview.length < cleanContent.length ? preview + '...' : preview
  }
  
  // Helper: Generate tags from lesson data
  private static generateTags(lessonData: LessonSaveData): string[] {
    const tags: string[] = []
    
    // Add subject and activity type
    tags.push(lessonData.subject)
    tags.push(lessonData.activityType)
    
    // Add grade level category
    const gradeNum = parseInt(lessonData.gradeLevel.match(/\d+/)?.[0] || '0')
    if (gradeNum <= 5) tags.push('Elementary')
    else if (gradeNum <= 8) tags.push('Middle School')
    else tags.push('High School')
    
    // Add duration category
    if (lessonData.duration <= 30) tags.push('Quick Activity')
    else if (lessonData.duration <= 60) tags.push('Standard Lesson')
    else tags.push('Extended Activity')
    
    // Add video tag if videos are included
    if (lessonData.selectedVideos && lessonData.selectedVideos.length > 0) {
      tags.push('With Videos')
    }
    
    // Add differentiation tag if applied
    if (lessonData.differentiationApplied) {
      tags.push('Differentiated')
    }
    
    return tags
  }
  
  // Get storage statistics
  static getStorageStats(): { totalLessons: number, totalSizeMB: number } {
    try {
      const lessons = MemoryBankService.getAllLessons()
      const dataString = JSON.stringify(lessons)
      const sizeBytes = new Blob([dataString]).size
      const sizeMB = Number((sizeBytes / (1024 * 1024)).toFixed(2))
      
      return {
        totalLessons: lessons.length,
        totalSizeMB: sizeMB
      }
    } catch (error) {
      return { totalLessons: 0, totalSizeMB: 0 }
    }
  }
}

// Hook for easy access to memory bank in components
export function useMemoryBank() {
  return {
    saveLesson: MemoryBankService.saveLesson,
    getAllLessons: MemoryBankService.getAllLessons,
    getLessonsForUser: MemoryBankService.getLessonsForUser,
    updateLessonUsage: MemoryBankService.updateLessonUsage,
    deleteLesson: MemoryBankService.deleteLesson,
    toggleFavorite: MemoryBankService.toggleFavorite,
    getStorageStats: MemoryBankService.getStorageStats
  }
}