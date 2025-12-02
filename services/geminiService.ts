import { GoogleGenAI, Type, Chat } from "@google/genai";
import { UserResult, AIAnalysisReport, CardAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateStudySummary = async (results: UserResult[]): Promise<AIAnalysisReport> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const prompt = `
    你是一位专业的英语私教。请分析用户以下的闪卡学习数据。
    
    **数据：**
    ${JSON.stringify(results.map(r => ({
      id: r.cardId,
      chinese: r.chinese,
      correctTarget: r.correctEnglish,
      userAttempt: r.userInput
    })))}

    请生成一个详细的 JSON 报告。

    **分析标准与逻辑：**
    1. **逐个对比**用户的输入（userAttempt）与正确答案（correctTarget）。
    2. **判定状态 (status)**：
       - **Passed (通过)**: 如果意思正确且表达自然（允许细微差异）。
       - **Not Passed (未通过)**: 如果存在明显错误或表达非常不自然。
    3. **判定错误类型 (errorType)**，请从以下类别中选择最贴切的一项：
       - "完全错误" (意思完全不同)
       - "表达不当" (意思对但语法/时态/搭配生硬或错误)
       - "词汇不当" (使用了不恰当或不自然的词汇)
       - "拼写错误" (单词拼写错误)
       - "不够完整" (缺少关键词汇或短语)
       - "过度表达" (包含不必要的冗余内容)
       - "部分正确" (部分对部分错)
       - "正确/完美" (如果没有错误)
    4. **反馈 (feedback)**：请用**中文**提供详细的改进建议和解释。
    5. **改进版本 (improvedVersion)**：提供最地道的英文表达。

    **JSON 输出要求：**
    严格按照 Schema 返回 JSON 数据。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.INTEGER, description: "0-100 score" },
            totalCards: { type: Type.INTEGER },
            accuracyRate: { type: Type.NUMBER, description: "Percentage 0-100" },
            difficultyLevel: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced"] },
            errorDistribution: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  count: { type: Type.INTEGER }
                }
              }
            },
            commonIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            positiveFeedback: { type: Type.STRING },
            cardAnalyses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  cardId: { type: Type.STRING },
                  status: { type: Type.STRING, enum: ["Passed", "Not Passed"] },
                  errorType: { 
                    type: Type.STRING, 
                    enum: [
                      "完全错误", 
                      "表达不当", 
                      "词汇不当", 
                      "拼写错误", 
                      "不够完整", 
                      "过度表达", 
                      "部分正确", 
                      "正确/完美"
                    ] 
                  },
                  feedback: { type: Type.STRING, description: "Detailed feedback in Chinese" },
                  improvedVersion: { type: Type.STRING }
                }
              }
            }
          },
          required: ["overallScore", "cardAnalyses", "errorDistribution", "commonIssues", "suggestions", "positiveFeedback"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    const report = JSON.parse(response.text) as AIAnalysisReport;

    // Merge original chinese, userInput, and bookmark status back into the card analysis for display
    report.cardAnalyses = report.cardAnalyses.map(analysis => {
      const originalResult = results.find(r => r.cardId === analysis.cardId);
      return {
        ...analysis,
        chinese: originalResult?.chinese || '',
        userInput: originalResult?.userInput || '',
        isBookmarked: originalResult?.isBookmarked || false
      };
    });

    return report;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const createChatSession = (report: AIAnalysisReport, card: CardAnalysis): Chat => {
    const systemInstruction = `
用户正在学习英文翻译。
背景信息：
- 已完成卡片数：${report.totalCards}
- 通过率：${report.accuracyRate}%
- 常见问题：${report.commonIssues.join(', ')}

当前用户正在查看的卡片信息：
- 中文原文：${card.chinese}
- 正确答案：${card.improvedVersion}
- 用户答案：${card.userInput}
- 错误类型：${card.errorType}
- AI 反馈：${card.feedback}

任务：
请用中文回答用户的问题。
1. 提供清晰的语法/词汇解释
2. 给出具体的例句对比
3. 解释正确答案为什么更好
4. 如果相关，提供类似表达的区别
5. 鼓励用户继续学习
    `;

    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
        }
    });

    return chat;
};