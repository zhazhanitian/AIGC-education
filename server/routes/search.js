import express from 'express'

const router = express.Router()

// Serper API 配置
const SERPER_API_URL = 'https://google.serper.dev/search'

// 动态获取 API Key（避免模块加载时环境变量未就绪）
const getSerperApiKey = () => process.env.SERPER_API_KEY || ''

/**
 * POST /api/search
 * 联网搜索接口
 * 
 * 请求体:
 *   - query: 搜索关键词 (必填)
 *   - num: 返回结果数量 (可选，默认 5)
 *   - gl: 地区代码 (可选，默认 cn)
 *   - hl: 语言代码 (可选，默认 zh-cn)
 * 
 * 返回:
 *   - success: boolean
 *   - results: [{ title, link, snippet, position }]
 *   - searchTime: 搜索耗时(ms)
 */
router.post('/search', async (req, res) => {
  const startTime = Date.now()
  console.log('[Search] Request received:', req.body)
  
  try {
    const { query, num = 5, gl = 'cn', hl = 'zh-cn' } = req.body
    
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: '搜索关键词不能为空'
      })
    }
    
    const apiKey = getSerperApiKey()
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: '搜索服务未配置，请设置 SERPER_API_KEY 环境变量'
      })
    }
    
    // 调用 Serper API
    const response = await fetch(SERPER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey
      },
      body: JSON.stringify({
        q: query.trim(),
        num: Math.min(num, 10), // 最多 10 条
        gl,
        hl
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Serper API error:', response.status, errorText)
      return res.status(response.status).json({
        success: false,
        error: `搜索服务错误: ${response.status}`
      })
    }
    
    const data = await response.json()
    
    // 格式化搜索结果
    const results = []
    
    // 处理 organic 结果（常规搜索结果）
    if (data.organic && Array.isArray(data.organic)) {
      data.organic.forEach((item, index) => {
        results.push({
          position: index + 1,
          title: item.title || '',
          link: item.link || '',
          snippet: item.snippet || '',
          type: 'organic'
        })
      })
    }
    
    // 处理知识图谱（如果有）
    if (data.knowledgeGraph) {
      const kg = data.knowledgeGraph
      if (kg.description) {
        results.unshift({
          position: 0,
          title: kg.title || '知识卡片',
          link: kg.descriptionLink || '',
          snippet: kg.description,
          type: 'knowledge'
        })
      }
    }
    
    // 处理 answerBox（直接答案）
    if (data.answerBox) {
      const ab = data.answerBox
      const answer = ab.answer || ab.snippet || ab.title || ''
      if (answer) {
        results.unshift({
          position: 0,
          title: ab.title || '快速回答',
          link: ab.link || '',
          snippet: answer,
          type: 'answer'
        })
      }
    }
    
    const searchTime = Date.now() - startTime
    
    console.log(`[Search] "${query}" -> ${results.length} results in ${searchTime}ms`)
    
    res.json({
      success: true,
      query: query.trim(),
      results: results.slice(0, num),
      searchTime
    })
    
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({
      success: false,
      error: error.message || '搜索服务异常'
    })
  }
})

/**
 * GET /api/search/status
 * 检查搜索服务状态
 */
router.get('/search/status', (req, res) => {
  res.json({
    enabled: !!getSerperApiKey(),
    provider: 'serper.dev'
  })
})

export default router
