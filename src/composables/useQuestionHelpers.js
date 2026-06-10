/**
 * 共享的题目相关 helper 函数
 * 用于替代各视图中重复定义的本地函数
 */
export function useQuestionHelpers() {
  /**
   * 获取题型中文文本
   * @param {string} type - 题型枚举值
   * @returns {string} 中文题型名
   */
  const getTypeText = (type) => {
    const texts = {
      SINGLE_CHOICE: '单选',
      MULTIPLE_CHOICE: '多选',
      TRUE_FALSE: '判断',
      FILL_BLANK: '填空',
      SHORT_ANSWER: '简答',
      CODING: '编程',
      SCENARIO: '情景'
    }
    return texts[type] || type
  }

  /**
   * 获取题型对应的 el-tag type
   * @param {string} type - 题型枚举值
   * @returns {string} Element Plus tag type
   */
  const getTypeTag = (type) => {
    const tags = {
      SINGLE_CHOICE: 'primary',
      MULTIPLE_CHOICE: 'success',
      TRUE_FALSE: 'warning',
      FILL_BLANK: 'info',
      SHORT_ANSWER: 'info',
      CODING: 'danger',
      SCENARIO: 'danger'
    }
    return tags[type] || 'info'
  }

  /**
   * 获取难度中文文本
   * 注意: 后端使用 HARD 而非 HIGH
   * @param {string} difficulty - 难度枚举值 (EASY/MEDIUM/HARD)
   * @returns {string} 中文难度名
   */
  const getDifficultyText = (difficulty) => {
    const texts = { EASY: '简单', MEDIUM: '中等', HARD: '困难' }
    return texts[difficulty] || difficulty
  }

  /**
   * 获取难度对应的 el-tag type
   * 注意: 后端使用 HARD 而非 HIGH
   * @param {string} difficulty - 难度枚举值 (EASY/MEDIUM/HARD)
   * @returns {string} Element Plus tag type
   */
  const getDifficultyType = (difficulty) => {
    const types = { EASY: 'success', MEDIUM: 'warning', HARD: 'danger' }
    return types[difficulty] || 'info'
  }

  return {
    getTypeText,
    getTypeTag,
    getDifficultyText,
    getDifficultyType
  }
}
