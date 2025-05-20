/**
 * 统计模块 API 测试脚本
 * 
 * 用于测试统计模块的前端 API 调用功能
 */

import { statsApi } from './api';

/**
 * 运行统计 API 测试
 */
export async function runStatsTests() {
  console.log('====== 开始测试统计 API ======');
  
  // 测试今日概览
  try {
    console.log('测试1: 获取今日概览');
    const todaySummary = await statsApi.getTodaySummary();
    console.log('今日概览结果:', todaySummary);
  } catch (error) {
    console.error('今日概览测试失败:', error);
  }
  
  // 测试带日期参数的今日概览
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0]; // 格式化为 YYYY-MM-DD
    
    console.log(`测试2: 获取特定日期 ${dateStr} 的概览`);
    const dateSummary = await statsApi.getTodaySummary(dateStr);
    console.log('特定日期概览结果:', dateSummary);
  } catch (error) {
    console.error('特定日期概览测试失败:', error);
  }
  
  // 测试周趋势
  try {
    console.log('测试3: 获取周趋势数据');
    const weekTrends = await statsApi.getTrends('week');
    console.log('周趋势数据结果:', weekTrends);
  } catch (error) {
    console.error('周趋势测试失败:', error);
  }
  
  // 测试月趋势
  try {
    console.log('测试4: 获取月趋势数据');
    const monthTrends = await statsApi.getTrends('month');
    console.log('月趋势数据结果:', monthTrends);
  } catch (error) {
    console.error('月趋势测试失败:', error);
  }
  
  // 测试年趋势
  try {
    console.log('测试5: 获取年趋势数据');
    const yearTrends = await statsApi.getTrends('year');
    console.log('年趋势数据结果:', yearTrends);
  } catch (error) {
    console.error('年趋势测试失败:', error);
  }
  
  // 测试带日期参数的趋势数据
  try {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const dateStr = fiveDaysAgo.toISOString().split('T')[0]; // 格式化为 YYYY-MM-DD
    
    console.log(`测试6: 获取截至 ${dateStr} 的周趋势数据`);
    const dateRangeTrends = await statsApi.getTrends('week', dateStr);
    console.log('特定日期范围趋势数据结果:', dateRangeTrends);
  } catch (error) {
    console.error('特定日期范围趋势测试失败:', error);
  }
  
  // 测试月度汇总
  try {
    const now = new Date();
    const month = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    console.log(`测试7: 获取 ${month} 的月度汇总`);
    const monthlySummary = await statsApi.getMonthlySummary(month);
    console.log('月度汇总结果:', monthlySummary);
  } catch (error) {
    console.error('月度汇总测试失败:', error);
  }
  
  // 测试报告导出
  try {
    console.log('测试8: 导出报告');
    const exportResult = await statsApi.exportReport();
    console.log('导出报告结果:', exportResult);
  } catch (error) {
    console.error('导出报告测试失败:', error);
  }
  
  console.log('====== 统计 API 测试完成 ======');
}

// 如果需要直接运行，可以在开发控制台调用此函数
// runStatsTests(); 