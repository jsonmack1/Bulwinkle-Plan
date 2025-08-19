import React from 'react'

interface ActivityCreationModalProps {
  isSubMode: boolean
  selectedDate: string
  setSelectedDate: (date: string) => void
  gradeLevel: string
  setGradeLevel: (level: string) => void
  subject: string
  setSubject: (subject: string) => void
  lessonTopic: string
  setLessonTopic: (topic: string) => void
  activityType: string
  handleActivityTypeChange: (type: string) => void
  customActivityType: string
  setCustomActivityType: (type: string) => void
  showCustomInput: boolean
  duration: string
  setDuration: (duration: string) => void
  substituteName: string
  setSubstituteName: (name: string) => void
  techPassword: string
  setTechPassword: (password: string) => void
  emergencyContacts: string
  setEmergencyContacts: (contacts: string) => void
  classSize: string
  setClassSize: (size: string) => void
  specialNotes: string
  setSpecialNotes: (notes: string) => void
  showAdvancedOptions: boolean
  setShowAdvancedOptions: (show: boolean) => void
  isFormValid: boolean
  activityOptions: any[]
  subjectSpecificActivities: any[]
  onClose: () => void
  onGenerate: () => void
}

const ActivityCreationModal: React.FC<ActivityCreationModalProps> = ({
  isSubMode,
  selectedDate,
  setSelectedDate,
  gradeLevel,
  setGradeLevel,
  subject,
  setSubject,
  lessonTopic,
  setLessonTopic,
  activityType,
  handleActivityTypeChange,
  customActivityType,
  setCustomActivityType,
  showCustomInput,
  duration,
  setDuration,
  substituteName,
  setSubstituteName,
  techPassword,
  setTechPassword,
  emergencyContacts,
  setEmergencyContacts,
  classSize,
  setClassSize,
  specialNotes,
  setSpecialNotes,
  showAdvancedOptions,
  setShowAdvancedOptions,
  isFormValid,
  activityOptions,
  subjectSpecificActivities,
  onClose,
  onGenerate
}) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900/50 to-indigo-900/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-3xl max-h-[85vh] overflow-y-auto mx-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {isSubMode ? 'Create Substitute Activity' : 'Build Teaching Activity'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl font-light"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Mode Indicator */}
          <div className={`${isSubMode ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} border rounded-xl p-4`}>
            <p className={`${isSubMode ? 'text-green-800' : 'text-blue-800'} text-sm`}>
              <strong>{isSubMode ? 'Substitute Mode:' : 'Teacher Mode:'}</strong> 
              {isSubMode 
                ? ' Creating simple, hands-off activities focused on discussion, independent work, and video resources. No preparation or special materials required.'
                : ' Creating comprehensive activities with advanced teaching strategies, differentiation options, and rich discussion opportunities.'
              }
            </p>
          </div>

          {/* Date Selection */}
          <div>
            <label htmlFor="date-select" className="block text-sm font-semibold text-gray-700 mb-2">
              Activity Date
            </label>
            <input
              id="date-select"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-4 border border-gray-200 bg-white rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 hover:border-gray-300 shadow-sm hover:shadow-md transition-all text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Grade Level */}
          <div>
            <label htmlFor="grade-select" className="block text-sm font-semibold text-gray-700 mb-2">
              Grade Level <span className="text-red-500">*</span>
            </label>
            <select
              id="grade-select"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="w-full p-4 border border-gray-200 bg-white rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 hover:border-gray-300 shadow-sm hover:shadow-md transition-all text-gray-900 appearance-none"
            >
              <option value="">Select grade level</option>
              <option value="PreK">PreK</option>
              <option value="Kindergarten">Kindergarten</option>
              <option value="1st Grade">1st Grade</option>
              <option value="2nd Grade">2nd Grade</option>
              <option value="3rd Grade">3rd Grade</option>
              <option value="4th Grade">4th Grade</option>
              <option value="5th Grade">5th Grade</option>
              <option value="6th Grade">6th Grade</option>
              <option value="7th Grade">7th Grade</option>
              <option value="8th Grade">8th Grade</option>
              <option value="9th Grade">9th Grade</option>
              <option value="10th Grade">10th Grade</option>
              <option value="11th Grade">11th Grade</option>
              <option value="12th Grade">12th Grade</option>
              
              {/* AP Classes */}
              <optgroup label="Advanced Placement (AP)">
                <option value="AP Biology">AP Biology</option>
                <option value="AP Chemistry">AP Chemistry</option>
                <option value="AP Physics 1">AP Physics 1</option>
                <option value="AP Physics 2">AP Physics 2</option>
                <option value="AP Physics C: Mechanics">AP Physics C: Mechanics</option>
                <option value="AP Physics C: E&M">AP Physics C: E&M</option>
                <option value="AP Calculus AB">AP Calculus AB</option>
                <option value="AP Calculus BC">AP Calculus BC</option>
                <option value="AP Statistics">AP Statistics</option>
                <option value="AP English Language & Composition">AP English Language & Composition</option>
                <option value="AP English Literature & Composition">AP English Literature & Composition</option>
                <option value="AP World History">AP World History</option>
                <option value="AP US History">AP US History</option>
                <option value="AP European History">AP European History</option>
                <option value="AP Government & Politics">AP Government & Politics</option>
                <option value="AP Economics (Macro)">AP Economics (Macro)</option>
                <option value="AP Economics (Micro)">AP Economics (Micro)</option>
                <option value="AP Psychology">AP Psychology</option>
                <option value="AP Art History">AP Art History</option>
                <option value="AP Computer Science A">AP Computer Science A</option>
                <option value="AP Computer Science Principles">AP Computer Science Principles</option>
                <option value="AP Environmental Science">AP Environmental Science</option>
              </optgroup>
            </select>
          </div>

          {/* Subject - Hidden for AP courses as subject is auto-determined */}
          {!gradeLevel.startsWith('AP ') && (
            <div>
              <label htmlFor="subject-select" className="block text-sm font-semibold text-gray-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                id="subject-select"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-4 border border-gray-200 bg-white rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 hover:border-gray-300 shadow-sm hover:shadow-md transition-all text-gray-900 appearance-none"
              >
                <option value="">Select subject</option>
                <option value="Math">Math</option>
                <option value="English Language Arts">English Language Arts</option>
                <option value="Science">Science</option>
                <option value="Social Studies">Social Studies</option>
                <option value="Art">Art</option>
                <option value="Music">Music</option>
                <option value="Physical Education">Physical Education</option>
                <option value="World Language">World Language</option>
                <option value="Health">Health</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}
          
          {/* AP Course Subject Display */}
          {gradeLevel.startsWith('AP ') && subject && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🎓</span>
                <div>
                  <h3 className="font-bold text-blue-900">{gradeLevel}</h3>
                  <p className="text-sm text-blue-700">Subject: {subject} • College Board Aligned</p>
                  <p className="text-xs text-blue-600 mt-1">
                    This AP course will include College Board CED framework, exam skill-building, and authentic college-level rigor.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Lesson Topic */}
          <div>
            <label htmlFor="lesson-topic" className="block text-sm font-semibold text-gray-700 mb-2">
              {gradeLevel.startsWith('AP ') ? 'Topic/Unit Focus' : 'Lesson Topic'} <span className="text-red-500">*</span>
            </label>
            <input
              id="lesson-topic"
              type="text"
              value={lessonTopic}
              onChange={(e) => setLessonTopic(e.target.value)}
              placeholder={
                gradeLevel.startsWith('AP ') 
                  ? "Enter specific topic or CED unit (e.g., 'Period 3: Revolution', 'Chemistry of Life', 'Calculus Applications')"
                  : "What specific topic will this activity cover? (e.g., Fractions, Civil War, Photosynthesis)"
              }
              className="w-full p-4 border border-gray-200 bg-white rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 hover:border-gray-300 shadow-sm hover:shadow-md transition-all text-gray-900 placeholder-gray-400"
            />
            {gradeLevel.startsWith('AP ') && (
              <p className="text-xs text-blue-600 mt-1">
                💡 Tip: Reference specific College Board units or skills for targeted CED alignment
              </p>
            )}
          </div>

          {/* Activity Type Selection */}
          <div>
            <label htmlFor="activity-type" className="block text-sm font-semibold text-gray-700 mb-2">
              Activity Type <span className="text-red-500">*</span>
            </label>
            <select
              id="activity-type"
              value={activityType}
              onChange={(e) => handleActivityTypeChange(e.target.value)}
              className="w-full p-4 border border-gray-200 bg-white rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 hover:border-gray-300 shadow-sm hover:shadow-md transition-all text-gray-900 appearance-none"
            >
              <option value="">Select activity type</option>
              
              <optgroup label="Universal Activities">
                {activityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </optgroup>
              
              {subject && subjectSpecificActivities.length > 0 && (
                <optgroup label={`${subject} Specific`}>
                  {subjectSpecificActivities.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            
            {showCustomInput && (
              <div className="mt-3">
                <input
                  type="text"
                  value={customActivityType}
                  onChange={(e) => setCustomActivityType(e.target.value)}
                  placeholder="Describe your custom activity type..."
                  className="w-full p-4 border border-gray-200 bg-white rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 hover:border-gray-300 shadow-sm hover:shadow-md transition-all text-gray-900 placeholder-gray-400"
                />
              </div>
            )}
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="duration" className="block text-sm font-semibold text-gray-700 mb-2">
              Duration (minutes)
            </label>
            <select
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full p-4 border border-gray-200 bg-white rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 hover:border-gray-300 shadow-sm hover:shadow-md transition-all text-gray-900 appearance-none"
            >
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="50">50 minutes (standard period)</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes (block)</option>
              {!isSubMode && <option value="120">120 minutes (double block)</option>}
            </select>
          </div>

          {/* Sub Mode Specific Fields */}
          {isSubMode && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-4">
              <h3 className="font-bold text-green-900 text-lg">Substitute Information (All Optional)</h3>
              <p className="text-sm text-green-700">
                These fields are optional - substitute plans work perfectly without them. Add info only if helpful.
              </p>
              
              <div>
                <label htmlFor="substitute-name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Substitute Name <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  id="substitute-name"
                  type="text"
                  value={substituteName}
                  onChange={(e) => setSubstituteName(e.target.value)}
                  placeholder="Name for personalized instructions (not required)"
                  className="w-full p-4 border border-gray-200 bg-white rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-300 hover:border-gray-300 shadow-sm hover:shadow-md transition-all text-gray-900 placeholder-gray-400"
                />
              </div>
              
              <div>
                <label htmlFor="tech-password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Technology Password <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  id="tech-password"
                  type="text"
                  value={techPassword}
                  onChange={(e) => setTechPassword(e.target.value)}
                  placeholder="Computer/projector access code (if needed)"
                  className="w-full p-4 border border-gray-200 bg-white rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-300 hover:border-gray-300 shadow-sm hover:shadow-md transition-all text-gray-900 placeholder-gray-400"
                />
              </div>
              
              <div>
                <label htmlFor="emergency-contacts" className="block text-sm font-semibold text-gray-700 mb-2">
                  Emergency Contacts <span className="text-gray-400">(Optional)</span>
                </label>
                <textarea
                  id="emergency-contacts"
                  value={emergencyContacts}
                  onChange={(e) => setEmergencyContacts(e.target.value)}
                  placeholder="Principal: John Smith - Ext. 101&#10;Nurse: Jane Doe - Ext. 102"
                  className="w-full p-4 border border-gray-200 bg-white rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-300 hover:border-gray-300 shadow-sm hover:shadow-md transition-all text-gray-900 placeholder-gray-400 resize-none"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Advanced Options */}
          <div className="border border-gray-200 rounded-xl">
            <button
              type="button"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="w-full flex items-center justify-between p-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all hover:shadow-sm"
            >
              <span className="font-semibold text-gray-900">
                Advanced Options
              </span>
              <span className="text-gray-600 text-lg">
                {showAdvancedOptions ? '⌄' : '⌃'}
              </span>
            </button>
            {showAdvancedOptions && (
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="class-size" className="block text-sm font-semibold text-gray-700 mb-2">
                    Class Size
                  </label>
                  <input
                    id="class-size"
                    type="text"
                    value={classSize}
                    onChange={(e) => setClassSize(e.target.value)}
                    placeholder="e.g., 28 students, Small group of 12, Large class of 35"
                    className="w-full p-4 border border-gray-200 bg-white rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 hover:border-gray-300 shadow-sm hover:shadow-md transition-all text-gray-900 placeholder-gray-400"
                  />
                </div>
                <div>
                  <label htmlFor="special-notes" className="block text-sm font-semibold text-gray-700 mb-2">
                    Special Notes
                  </label>
                  <textarea
                    id="special-notes"
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder={isSubMode 
                      ? "Any special classroom procedures or student needs to consider"
                      : "Differentiation needs, learning objectives, assessment criteria, etc."
                    }
                    className="w-full p-4 border border-gray-200 bg-white rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 hover:border-gray-300 shadow-sm hover:shadow-md transition-all text-gray-900 placeholder-gray-400 resize-none"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button 
            onClick={onGenerate}
            disabled={!isFormValid}
            className={`w-full ${isSubMode ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'} text-white py-5 rounded-3xl text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-3`}
          >
            <span className="text-2xl">{isSubMode ? '🚀' : '⭐'}</span>
            <span>{isSubMode ? 'Generate Sub Plan' : 'Build Lesson Plan'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ActivityCreationModal