import React, { useState } from 'react'
import { SearchFilters, ActivityNode } from '../../types/memoryBank'
import { SuggestionHelpers } from '../../lib/smartSuggestions'

interface SearchAndFilterProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  totalCount: number
  filteredCount: number
  activities?: ActivityNode[]
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
  activities = []
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: '',
      subject: '',
      gradeLevel: '',
      timeframe: 'all',
      mode: 'all',
      sortBy: 'recent'
    })
  }

  const hasActiveFilters = filters.searchTerm || 
    (filters.subject && filters.subject !== 'all') ||
    (filters.gradeLevel && filters.gradeLevel !== 'all') ||
    (filters.timeframe && filters.timeframe !== 'all') ||
    (filters.mode && filters.mode !== 'all')

  // Get smart search suggestions
  const smartSuggestions = activities.length > 0 
    ? SuggestionHelpers.getQuickSearchSuggestions(activities)
    : []

  const handleSmartSuggestionClick = (suggestion: any) => {
    // Parse the suggestion query and apply appropriate filters
    if (suggestion.query.startsWith('rating:')) {
      onFiltersChange({ ...filters, sortBy: 'rating' })
    } else if (suggestion.query.includes('sort:popular')) {
      onFiltersChange({ ...filters, sortBy: 'popular' })
    } else if (suggestion.query.includes('timeframe:month')) {
      onFiltersChange({ ...filters, timeframe: 'month' })
    } else if (suggestion.query.startsWith('subject:')) {
      const subject = suggestion.query.split(':')[1]
      onFiltersChange({ ...filters, subject })
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="e.g., Photosynthesis, Civil War, Fractions..."
          value={filters.searchTerm}
          onChange={(e) => updateFilter('searchTerm', e.target.value)}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 placeholder:italic placeholder:font-light transition-colors"
        />
        {filters.searchTerm && (
          <button
            onClick={() => updateFilter('searchTerm', '')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Smart Suggestions - Only show when search is empty */}
      {!filters.searchTerm && smartSuggestions.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 mb-4">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
            <span className="mr-1">💡</span>
            Quick Finds
          </h4>
          
          {/* Compact 2-column grid */}
          <div className="grid grid-cols-2 gap-2">
            {smartSuggestions.slice(0, 6).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSmartSuggestionClick(suggestion)}
                className="text-xs bg-white px-2 py-1.5 rounded border hover:border-blue-300 transition-colors text-left flex items-center space-x-1"
              >
                <span>{suggestion.icon}</span>
                <span>{suggestion.label}</span>
              </button>
            ))}
            {smartSuggestions.length > 6 && (
              <button className="text-xs bg-white px-2 py-1.5 rounded border hover:border-blue-300 transition-colors text-left">
                ➕ More suggestions
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick Filters Row */}
      <div className="flex flex-wrap gap-2">
        <select 
          value={filters.timeframe}
          onChange={(e) => updateFilter('timeframe', e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">📅 All Time</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">Last 3 Months</option>
          <option value="year">This Year</option>
        </select>

        <select 
          value={filters.mode}
          onChange={(e) => updateFilter('mode', e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">👥 All Modes</option>
          <option value="teacher">👩‍🏫 Teacher Mode</option>
          <option value="substitute">🔄 Sub Mode</option>
        </select>

        <select 
          value={filters.sortBy}
          onChange={(e) => updateFilter('sortBy', e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="recent">📅 Most Recent</option>
          <option value="popular">🔥 Most Used</option>
          <option value="rating">⭐ Highest Rated</option>
          <option value="alphabetical">🔤 Alphabetical</option>
        </select>

        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`text-sm px-3 py-2 rounded-lg border transition-colors ${
            showAdvancedFilters 
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
          }`}
        >
          ⚙️ {showAdvancedFilters ? 'Hide' : 'More'} Filters
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="space-y-3 border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select 
                value={filters.subject}
                onChange={(e) => updateFilter('subject', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Subjects</option>
                <option value="Math">📐 Math</option>
                <option value="Science">🔬 Science</option>
                <option value="English Language Arts">📚 English Language Arts</option>
                <option value="Social Studies">🌍 Social Studies</option>
                <option value="Art">🎨 Art</option>
                <option value="Music">🎵 Music</option>
                <option value="Physical Education">⚽ Physical Education</option>
                <option value="Computer Science">💻 Computer Science</option>
                <option value="World Language">🌐 World Language</option>
                <option value="Health">🏥 Health</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
              <select 
                value={filters.gradeLevel}
                onChange={(e) => updateFilter('gradeLevel', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Grade Levels</option>
                <optgroup label="Elementary">
                  <option value="PreK">PreK</option>
                  <option value="Kindergarten">Kindergarten</option>
                  <option value="1st Grade">1st Grade</option>
                  <option value="2nd Grade">2nd Grade</option>
                  <option value="3rd Grade">3rd Grade</option>
                  <option value="4th Grade">4th Grade</option>
                  <option value="5th Grade">5th Grade</option>
                </optgroup>
                <optgroup label="Middle School">
                  <option value="6th Grade">6th Grade</option>
                  <option value="7th Grade">7th Grade</option>
                  <option value="8th Grade">8th Grade</option>
                </optgroup>
                <optgroup label="High School">
                  <option value="9th Grade">9th Grade</option>
                  <option value="10th Grade">10th Grade</option>
                  <option value="11th Grade">11th Grade</option>
                  <option value="12th Grade">12th Grade</option>
                </optgroup>
                <optgroup label="Advanced Placement (AP)">
                  <option value="AP Biology">AP Biology</option>
                  <option value="AP Chemistry">AP Chemistry</option>
                  <option value="AP Physics 1">AP Physics 1</option>
                  <option value="AP US History">AP US History</option>
                  <option value="AP English Literature">AP English Literature</option>
                  <option value="AP Calculus AB">AP Calculus AB</option>
                  <option value="AP Psychology">AP Psychology</option>
                </optgroup>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex justify-end pt-3 border-t border-gray-200">
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Clear Filters</span>
          </button>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2">
          {filters.searchTerm && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
              🔍 "{filters.searchTerm}"
              <button 
                onClick={() => updateFilter('searchTerm', '')}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.subject && filters.subject !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
              📚 {filters.subject}
              <button 
                onClick={() => updateFilter('subject', '')}
                className="ml-1 text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.gradeLevel && filters.gradeLevel !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
              🎓 {filters.gradeLevel}
              <button 
                onClick={() => updateFilter('gradeLevel', '')}
                className="ml-1 text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.mode && filters.mode !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
              {filters.mode === 'teacher' ? '👩‍🏫' : '🔄'} {filters.mode}
              <button 
                onClick={() => updateFilter('mode', 'all')}
                className="ml-1 text-orange-600 hover:text-orange-800"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.timeframe && filters.timeframe !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
              📅 {filters.timeframe}
              <button 
                onClick={() => updateFilter('timeframe', 'all')}
                className="ml-1 text-gray-600 hover:text-gray-800"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchAndFilter