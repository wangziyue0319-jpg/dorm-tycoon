'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  Calendar,
  Briefcase,
  BookOpen,
  Search,
  Moon,
  Newspaper,
  LogOut,
  AlertTriangle,
  X,
} from 'lucide-react';

// 类型定义
type Sector = '消费' | '硬件' | '内卷' | '基建';
type FundType = '混合型' | '股票型' | '债券型';
type RiskLevel = 'R1' | 'R2' | 'R3' | 'R4' | 'R5';

interface Stock {
  id: number;
  name: string;
  sector: Sector;
  price: number;
  previousPrice: number;
  held: number;
  history: number[];
  volatility: number; // 基础波动率
  consecutiveUpDays: number; // 连续上涨天数
  isFund?: boolean; // 是否为基金
  holdingDays?: number; // 持有天数（用于基金分红）
  fundType?: 'high' | 'medium' | 'low' | 'stable'; // 基金波动类型
  type?: FundType; // 基金类型
  riskLevel?: RiskLevel; // 风险等级
}

interface RandomEvent {
  message: string;
  impact: (stocks: Stock[], intelligence: number) => void;
  studyCostMultiplier?: number; // 学习精力消耗倍率
}

interface ChoiceEvent {
  id: string;
  title: string;
  description: string;
  optionA: {
    text: string;
    action: () => void;
  };
  optionB: {
    text: string;
    action: () => void;
  };
  optionC?: {
    text: string;
    action: () => void;
  };
}

interface Log {
  id: number;
  day: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export default function DormTycoon() {
  // 游戏状态
  const [isGameStarted, setIsGameStarted] = useState(false); // 是否开始游戏
  const [cash, setCash] = useState(500);
  const [energy, setEnergy] = useState(100);
  const [intelligence, setIntelligence] = useState(10);
  const [currentDay, setCurrentDay] = useState(1);
  const [totalDays] = useState(28);
  const [logs, setLogs] = useState<Log[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [tomorrowForecast, setTomorrowForecast] = useState<string[]>([]);
  const [studyCostMultiplier, setStudyCostMultiplier] = useState(1); // 学习精力消耗倍率
  const [currentChoiceEvent, setCurrentChoiceEvent] = useState<ChoiceEvent | null>(null); // 当前抉择事件
  const [intelligenceAlert, setIntelligenceAlert] = useState(false); // 智力不足弹窗
  const [goodCardDays, setGoodCardDays] = useState(0); // 好人卡剩余天数
  const [tradingLocked, setTradingLocked] = useState(false); // 交易锁定（电脑蓝屏）
  const [actionPoints, setActionPoints] = useState(2); // 当前行动点
  const [maxActionPoints] = useState(2); // 每日行动点上限
  const [actionToast, setActionToast] = useState(false); // 行动点不足提示
  const [apologyPenalty, setApologyPenalty] = useState(0); // 写检讨惩罚（消耗行动点）

  // 每日新闻弹窗状态
  const [showDailyNews, setShowDailyNews] = useState(false); // 显示每日新闻弹窗
  const [pendingNews, setPendingNews] = useState(''); // 待显示的新闻

  // 舍友抽烟事件相关状态
  const [justiceMessenger, setJusticeMessenger] = useState(false); // 正义使者称号（等待报复）
  const [roommateGoneDays, setRoommateGoneDays] = useState(0); // 舍友搬离剩余天数
  const [easygoing, setEasygoing] = useState(false); // 好说话标记（提升顺手牵羊概率）
  const [hasBadReputation, setHasBadReputation] = useState(false); // 变坏标记（辅导员查寝时可能被判定为从犯）
  const [maxEnergyBonus, setMaxEnergyBonus] = useState(0); // 精力上限加成

  // 基金数据 - 重构为4只核心基金
  const [stocks, setStocks] = useState<Stock[]>([
    // 基金 A - 混合型 R3
    {
      id: 1,
      name: '混合型-校园多巴胺综合精选',
      sector: '消费',
      price: 15.0,
      previousPrice: 15.0,
      held: 0,
      history: [15.0],
      volatility: 0.25,
      consecutiveUpDays: 0,
      isFund: true,
      holdingDays: 0,
      fundType: 'high',
      type: '混合型',
      riskLevel: 'R3'
    },
    // 基金 B - 股票型 R5
    {
      id: 2,
      name: '股票型-赛博消闲娱乐ETF',
      sector: '硬件',
      price: 50.0,
      previousPrice: 50.0,
      held: 0,
      history: [50.0],
      volatility: 0.45,
      consecutiveUpDays: 0,
      isFund: true,
      holdingDays: 0,
      fundType: 'high',
      type: '股票型',
      riskLevel: 'R5'
    },
    // 基金 C - 股票型 R4
    {
      id: 3,
      name: '股票型-上岸必胜学习增强',
      sector: '内卷',
      price: 25.0,
      previousPrice: 25.0,
      held: 0,
      history: [25.0],
      volatility: 0.15,
      consecutiveUpDays: 0,
      isFund: true,
      holdingDays: 0,
      fundType: 'medium',
      type: '股票型',
      riskLevel: 'R4'
    },
    // 基金 D - 债券型 R1
    {
      id: 4,
      name: '债券型-校园基建稳健债基',
      sector: '基建',
      price: 12.0,
      previousPrice: 12.0,
      held: 0,
      history: [12.0],
      volatility: 0.02,
      consecutiveUpDays: 0,
      isFund: true,
      holdingDays: 0,
      fundType: 'stable',
      type: '债券型',
      riskLevel: 'R1'
    },
  ]);

  const [news, setNews] = useState('今天是游戏的第一天，股市平稳开盘。');

  // 添加日志
  const addLog = (message: string, type: Log['type'] = 'info') => {
    setLogs(prev => [...prev, { id: Date.now(), day: currentDay, message, type }]);
  };

  // 生成当日新闻
  const generateDailyNews = (): string => {
    const newsEvents = [
      '今日校园气氛平稳，市场走势值得关注。',
      '图书馆今天人满为患，看来大家都在努力学习！',
      '食堂推出了新菜品，学生们络绎不绝。',
      '社团活动丰富多彩，校园充满活力。',
      '天气晴朗，适合外出活动。',
      '期末临近，校园学习氛围渐浓。',
      '求职季到了，同学们开始准备简历。',
      '校园网络升级完成，网速大幅提升。',
      '新学期开始，校园处处充满生机。',
      '毕业季临近，校园里弥漫着离别的气息。',
      '运动场扩建完成，体育设施更加完善。',
      '校园超市促销活动火热进行中。',
      '图书馆新增自习室，学习空间更加宽敞。',
      '校园周边美食街开业，吃货们有福了！',
      '校园广播站今日播放：努力奋斗，未来可期！',
      '天气转凉，同学们注意添衣保暖。',
      '校园文化节即将举办，各社团紧张筹备中。',
      '新学期选课开始，热门课程瞬间爆满。',
      '校园招聘会即将举办，知名企业将来校。',
      '期末考试周即将来临，校园进入复习模式。',
    ];
    return newsEvents[Math.floor(Math.random() * newsEvents.length)];
  };

  // 计算资产总值
  const calculateTotalAssets = () => {
    return cash + stocks.reduce((sum, stock) => sum + stock.held * stock.price, 0);
  };

  // 计算单一股票的持仓上限（基于智力）
  const getMaxHolding = () => intelligence * 50;

  // 买入股票 - 增加投资限额判断、基金门槛和弹窗提示
  const buyStock = (stockId: number, amount: number = 1) => {
    if (gameOver) return;

    if (tradingLocked) {
      addLog('电脑蓝屏维修中，无法进行交易！', 'error');
      return;
    }

    const stock = stocks.find(s => s.id === stockId);
    if (!stock) return;

    // 投资限额检查
    const maxHolding = getMaxHolding();
    if (stock.held + amount > maxHolding) {
      // 显示弹窗提示
      setIntelligenceAlert(true);
      return;
    }

    const cost = stock.price * amount;
    if (cash < cost) {
      addLog(`现金不足，无法买入 ${stock.name}`, 'error');
      return;
    }

    setCash(prev => prev - cost);
    setStocks(prev => prev.map(s => {
      if (s.id === stockId) {
        return {
          ...s,
          held: s.held + amount,
          // 初始化或保持holdingDays
          holdingDays: s.holdingDays || 0
        };
      }
      return s;
    }));
    addLog(`买入 ${amount} 股 ${stock.name}，花费 ¥${cost.toFixed(2)}`, 'success');
  };

  // 卖出基金
  const sellStock = (stockId: number, amount: number = 1) => {
    if (gameOver) return;

    if (tradingLocked) {
      addLog('电脑蓝屏维修中，无法进行交易！', 'error');
      return;
    }

    const stock = stocks.find(s => s.id === stockId);
    if (!stock) return;

    if (stock.held < amount) {
      addLog(`持仓不足，无法卖出 ${stock.name}`, 'error');
      return;
    }

    const revenue = stock.price * amount;
    setCash(prev => prev + revenue);
    setStocks(prev => prev.map(s => {
      if (s.id === stockId) {
        const newHeld = s.held - amount;
        return {
          ...s,
          held: newHeld,
          // 如果全部卖出，重置holdingDays
          holdingDays: newHeld === 0 ? 0 : s.holdingDays
        };
      }
      return s;
    }));
    addLog(`卖出 ${amount} 股 ${stock.name}，获得 ¥${revenue.toFixed(2)}`, 'success');
  };

  // 兼职行动
  const doPartTimeJob = () => {
    if (gameOver) return;

    // 检查行动点
    if (actionPoints <= 0) {
      setActionToast(true);
      setTimeout(() => setActionToast(false), 2000);
      return;
    }

    if (energy < 30) {
      addLog('精力不足，无法兼职', 'warning');
      return;
    }

    const earnings = 30 + Math.floor(intelligence / 2);
    setEnergy(prev => prev - 30);
    setCash(prev => prev + earnings);
    setActionPoints(prev => prev - 1); // 消耗行动点
    addLog(`完成兼职工作，获得 ¥${earnings}，消耗30精力，剩余行动点: ${actionPoints - 1}`, 'success');
  };

  // 学习行动
  const doStudy = () => {
    if (gameOver) return;

    // 检查行动点
    if (actionPoints <= 0) {
      setActionToast(true);
      setTimeout(() => setActionToast(false), 2000);
      return;
    }

    const cost = Math.floor(40 * studyCostMultiplier);
    if (energy < cost) {
      addLog('精力不足，无法学习', 'warning');
      return;
    }

    setEnergy(prev => prev - cost);
    setIntelligence(prev => prev + 2);
    setActionPoints(prev => prev - 1); // 消耗行动点
    const multiplierText = studyCostMultiplier > 1 ? ` (消耗x${studyCostMultiplier})` : '';
    addLog(`努力学习，智力+2，消耗${cost}精力${multiplierText}，剩余行动点: ${actionPoints - 1}`, 'success');
  };

  // 调研行动
  const doResearch = () => {
    if (gameOver) return;

    // 检查行动点
    if (actionPoints <= 0) {
      setActionToast(true);
      setTimeout(() => setActionToast(false), 2000);
      return;
    }

    if (energy < 20) {
      addLog('精力不足，无法调研', 'warning');
      return;
    }

    setEnergy(prev => prev - 20);
    setActionPoints(prev => prev - 1); // 消耗行动点

    // 生成明天预测
    const forecasts = stocks.map(stock => {
      const change = (Math.random() - 0.5) * 20;
      const direction = change > 0 ? '上涨' : '下跌';
      return `${stock.name}: 预计${direction}`;
    });

    setTomorrowForecast(forecasts);
    addLog('完成市场调研，查看了明日走势预测，消耗20精力，剩余行动点: ' + (actionPoints - 1), 'info');
  };

  // 休息行动
  const doRest = () => {
    if (gameOver) return;

    const bonus = goodCardDays > 0 ? 10 : 0;
    const maxEnergy = 100 + maxEnergyBonus;
    setEnergy(prev => Math.min(maxEnergy, prev + 50 + bonus));

    // 注意：行动点不会在休息时恢复，只在结束一天进入第二天时才恢复

    if (bonus > 0) {
      addLog(`好好休息，精力+${50 + bonus}（好人卡加成+${bonus}）`, 'success');
    } else {
      addLog('好好休息，精力+50', 'success');
    }
  };

  // 随机事件生成器 - 适配4只基金体系
  const generateRandomEvent = (): RandomEvent => {
    const events: RandomEvent[] = [
      // 消费类基金事件
      {
        message: '社团招新季到来，校园消费热潮！',
        impact: (stocks: Stock[]) => {
          const idx = stocks.findIndex(s => s.name.includes('糖分消费'));
          if (idx !== -1) stocks[idx].price *= 1.25;
        }
      },
      {
        message: '天气转凉，校园消费热情下降。',
        impact: (stocks: Stock[]) => {
          const idx = stocks.findIndex(s => s.name.includes('糖分消费'));
          if (idx !== -1) stocks[idx].price *= 0.85;
        }
      },
      // 硬件类基金事件
      {
        message: '【矿潮来袭】显卡价格暴涨！',
        impact: (stocks: Stock[]) => {
          const idx = stocks.findIndex(s => s.name.includes('赛博游戏'));
          if (idx !== -1) stocks[idx].price *= 1.5;
        }
      },
      {
        message: '【深夜停电】全校停电，硬件需求暴跌！',
        impact: (stocks: Stock[]) => {
          const idx = stocks.findIndex(s => s.name.includes('赛博游戏'));
          if (idx !== -1) stocks[idx].price *= 0.6;
        }
      },
      {
        message: '【新游发布】爆款游戏带动硬件销售！',
        impact: (stocks: Stock[]) => {
          const idx = stocks.findIndex(s => s.name.includes('赛博游戏'));
          if (idx !== -1) stocks[idx].price *= 1.35;
        }
      },
      {
        message: '【显卡价格崩盘】矿难来临，显卡价格暴跌！',
        impact: (stocks: Stock[]) => {
          const idx = stocks.findIndex(s => s.name.includes('赛博游戏'));
          if (idx !== -1) stocks[idx].price *= 0.55;
        }
      },
      {
        message: '【疯狂的宿管阿姨】宿管突然查寝，没收你的游戏设备！',
        impact: (stocks: Stock[]) => {
          const idx = stocks.findIndex(s => s.name.includes('赛博游戏'));
          if (idx !== -1 && stocks[idx].held > 0) {
            const confiscated = Math.floor(stocks[idx].held / 2);
            stocks[idx].held -= confiscated;
            setApologyPenalty(2);
          }
        }
      },
      // 内卷类基金事件
      {
        message: '【大厂提前批面试】知名企业开启提前批面试！',
        impact: (stocks: Stock[], intelligence: number) => {
          const idx = stocks.findIndex(s => s.name.includes('上岸必胜'));
          if (idx !== -1) stocks[idx].price *= 1.2;
          if (intelligence > 20) {
            const idx2 = stocks.findIndex(s => s.name.includes('上岸必胜'));
            if (idx2 !== -1) stocks[idx2].price *= 1.1;
          }
        },
        studyCostMultiplier: 2
      },
      {
        message: '毕业季临近，求职培训需求激增！',
        impact: (stocks: Stock[]) => {
          const idx = stocks.findIndex(s => s.name.includes('上岸必胜'));
          if (idx !== -1) stocks[idx].price *= 1.2;
        }
      },
      {
        message: '期末考试周临近，上岸必胜基金全面上涨！',
        impact: (stocks: Stock[]) => {
          const idx = stocks.findIndex(s => s.name.includes('上岸必胜'));
          if (idx !== -1) stocks[idx].price *= 1.25;
        }
      },
      {
        message: '知名企业来校宣讲，内卷板块受益！',
        impact: (stocks: Stock[]) => {
          const idx = stocks.findIndex(s => s.name.includes('上岸必胜'));
          if (idx !== -1) stocks[idx].price *= 1.15;
        }
      },
      // 基建类基金事件
      {
        message: '校园网络升级完成，基建板块受益！',
        impact: (stocks: Stock[]) => {
          const idx = stocks.findIndex(s => s.name.includes('基建稳健'));
          if (idx !== -1) stocks[idx].price *= 1.08;
        }
      },
      {
        message: '【极端暴雨天气】连续暴雨，基建服务受影响！',
        impact: (stocks: Stock[]) => {
          const idx = stocks.findIndex(s => s.name.includes('基建稳健'));
          if (idx !== -1) stocks[idx].price *= 0.95;
        }
      },
      // 通用事件
      {
        message: '学校发布就业报告，整体市场平稳。',
        impact: () => {}
      },
      {
        message: '【被拉入500人群】精力-20，智力+2',
        impact: (stocks: Stock[]) => {
          setEnergy(prev => Math.max(0, prev - 20));
          setIntelligence(prev => prev + 2);
        }
      },
      {
        message: '【舍友的疯狂报复】舍友搬回来了，对你的投资组合动手！',
        impact: (stocks: Stock[]) => {
          const heldStocks = stocks.filter(s => s.held > 0);
          if (heldStocks.length > 0) {
            const targetStock = heldStocks[Math.floor(Math.random() * heldStocks.length)];
            const lost = Math.floor(targetStock.held * 0.3);
            targetStock.held -= lost;
          }
        }
      },
      {
        message: '【顺手牵羊】损失¥50',
        impact: (stocks: Stock[]) => {
          setCash(prev => Math.max(0, prev - 50));
        }
      },
      {
        message: '【辅导员突击查寝】检查宿舍卫生。',
        impact: (stocks: Stock[]) => {}
      },
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    return event;
  };

  // 生成财富招忌抉择事件
  const generateWealthEvent = (): ChoiceEvent | null => {
    const initialWealth = 500;
    const currentAssets = calculateTotalAssets();
    const wealthRatio = currentAssets / initialWealth;

    // 资产每翻一倍，负面事件权重增加
    const negativeEventWeight = Math.floor(wealthRatio / 2) * 0.15;

    // 基础触发概率 10%，每翻倍增加 15%
    const triggerChance = 0.1 + negativeEventWeight;

    if (Math.random() > triggerChance) {
      return null;
    }

    const events: ChoiceEvent[] = [
      {
        id: 'roommate-borrow',
        title: '【室友借钱】',
        description: '室友看到你最近在股市赚了不少钱，想借¥200换个新手机。',
        optionA: {
          text: '借钱给他（-¥200，获得好人卡）',
          action: () => {
            setCash(prev => Math.max(0, prev - 200));
            setGoodCardDays(3);
            addLog('你借了¥200给室友，获得【好人卡】，未来3天休息精力+10', 'success');
          }
        },
        optionB: {
          text: '拒绝（室友在寝室公放音乐，-20精力）',
          action: () => {
            setEnergy(prev => Math.max(0, prev - 20));
            addLog('你拒绝了室友，他在寝室公放音乐报复，精力-20', 'warning');
          }
        }
      },
      {
        id: 'advisor-attention',
        title: '【导师盯上】',
        description: '导师发现你最近沉迷股市，不太专心学习。',
        optionA: {
          text: '写报告（-40精力，智力+5）',
          action: () => {
            setEnergy(prev => Math.max(0, prev - 40));
            setIntelligence(prev => prev + 5);
            addLog('你认真写了研究报告，导师很满意，智力+5', 'success');
          }
        },
        optionB: {
          text: '逃课交易（-20智力，随机股票被强制平仓）',
          action: () => {
            setIntelligence(prev => Math.max(0, prev - 20));
            // 找到持仓最多的股票并强制平仓
            const heldStocks = stocks.filter(s => s.held > 0);
            if (heldStocks.length > 0) {
              const targetStock = heldStocks.reduce((prev, current) =>
                current.held > prev.held ? current : prev
              );
              setStocks(prev => prev.map(s =>
                s.id === targetStock.id ? { ...s, held: 0 } : s
              ));
              addLog(`导师没收了你的"作案工具"，${targetStock.name}被强制平仓！智力-20`, 'error');
            } else {
              setIntelligence(prev => Math.max(0, prev - 20));
              addLog('你逃课被抓住了，智力-20', 'warning');
            }
          }
        }
      },
      {
        id: 'computer-crash',
        title: '【电脑蓝屏】',
        description: '显卡超频烧了，需要维修费¥150，当天无法交易。',
        optionA: {
          text: '维修（-¥150，解锁交易）',
          action: () => {
            setCash(prev => Math.max(0, prev - 150));
            addLog('电脑维修完成，花费¥150', 'warning');
          }
        },
        optionB: {
          text: '先不修（无法交易直到维修）',
          action: () => {
            addLog('电脑未维修，交易功能锁定', 'error');
          }
        }
      },
      {
        id: 'roommate-smoking',
        title: '【舍友偷偷抽烟】',
        description: '深夜，你被一阵极其隐蔽的打火机声惊醒。睁眼一看，那个讨厌的舍友正蹲在阳台角落"吞云吐雾"，烟味已经飘满了寝室。',
        optionA: {
          text: '反手一个举报（精力上限+20，正义使者称号）',
          action: () => {
            setMaxEnergyBonus(20);
            setJusticeMessenger(true);
            setRoommateGoneDays(3);
            addLog('你举报了舍友抽烟！他被处分并搬离3天。精力上限+20，获得【正义使者】称号', 'success');
          }
        },
        optionB: {
          text: '假装没看见（-10精力，顺手牵羊概率+20%）',
          action: () => {
            setEnergy(prev => Math.max(0, prev - 10));
            setEasygoing(true);
            addLog('你选择了沉默，舍友觉得你"好说话"。精力-10，未来"顺手牵羊"事件概率提升', 'warning');
          }
        },
        optionC: {
          text: '以此要挟（+¥150，基金内部消息，智力-5）',
          action: () => {
            setCash(prev => prev + 150);
            setIntelligence(prev => prev - 5);
            setHasBadReputation(true);
            setTomorrowForecast(['校园混合成长基金: 内部消息显示将上涨']);
            addLog('你收了舍友¥150封口费，获得基金内部消息。但你变坏了...智力-5', 'success');
            addLog('警告：若触发"辅导员查寝"事件，你有30%概率被判定为从犯', 'warning');
          }
        }
      }
    ];

    return events[Math.floor(Math.random() * events.length)];
  };

  // 处理抉择事件选择
  const handleChoice = (option: 'A' | 'B' | 'C') => {
    if (!currentChoiceEvent) return;

    // 如果是电脑蓝屏事件，选择维修则解锁交易
    if (currentChoiceEvent.id === 'computer-crash') {
      if (option === 'A') {
        setTradingLocked(false);
      } else {
        setTradingLocked(true);
      }
    }

    if (option === 'A') {
      currentChoiceEvent.optionA.action();
    } else if (option === 'B') {
      currentChoiceEvent.optionB.action();
    } else if (option === 'C' && currentChoiceEvent.optionC) {
      currentChoiceEvent.optionC.action();
    }

    setCurrentChoiceEvent(null);

    // 继续完成一天结算
    const nextDay = currentDay + 1;
    setCurrentDay(nextDay);

    // 生成当天的新闻
    const dailyNews = generateDailyNews();
    setNews(dailyNews);

    // 重置行动点，应用写检讨惩罚
    const finalActionPoints = Math.max(0, maxActionPoints - apologyPenalty);
    setActionPoints(finalActionPoints);
    if (apologyPenalty > 0) {
      addLog(`【写检讨】宿管阿姨要求写检讨，行动点 -${apologyPenalty}`, 'warning');
      setApologyPenalty(0); // 重置惩罚
    }

    // 检查游戏胜利
    if (nextDay > totalDays) {
      const totalAssets = calculateTotalAssets();
      if (totalAssets >= 2000) {
        addLog(`恭喜！28天结束，总资产 ¥${totalAssets.toFixed(2)}，你成为了寝室大亨！`, 'success');
      } else {
        addLog(`28天结束，总资产 ¥${totalAssets.toFixed(2)}，继续努力！`, 'info');
      }
      setGameOver(true);
    } else {
      addLog(`=== 第 ${nextDay} 天 ===`, 'info');
      // 触发每日新闻弹窗
      setPendingNews(dailyNews);
      setShowDailyNews(true);
    }
  };

  // 结束这一天 - 包含板块联动逻辑
  const endDay = () => {
    if (gameOver) return;

    // 扣除生活费
    const livingCost = 30;
    if (cash < livingCost) {
      setCash(0);
      addLog('现金不足以支付生活费！', 'error');
    } else {
      setCash(prev => prev - livingCost);
      addLog(`支付生活费 -¥${livingCost}`, 'warning');
    }

    // 检查破产
    if (calculateTotalAssets() <= 0) {
      setGameOver(true);
      addLog('你破产了！游戏结束。', 'error');
      return;
    }

    // 检查精力
    if (energy <= 0) {
      setGameOver(true);
      addLog('精力耗尽倒下了！游戏结束。', 'error');
      return;
    }

    // 更新所有基金价格 - 根据基金类型应用不同波动率算法
    let updatedStocks = stocks.map(stock => {
      let changePercent = 0;

      switch (stock.fundType) {
        case 'high': // 多巴胺综合、赛博消闲 - 极高/高波动
          if (stock.name.includes('赛博消闲')) {
            // 极高波动：容易受黑天鹅事件影响
            // 基础波动 + 随机暴涨暴跌概率
            const baseVolatility = (Math.random() - 0.5) * 0.6; // -30% ~ +30%
            const blackSwan = Math.random() < 0.05 ? (Math.random() > 0.5 ? 0.4 : -0.4) : 0; // 5%概率暴涨/暴跌40%
            changePercent = baseVolatility + blackSwan;
          } else {
            // 多巴胺综合 - 中高波动，受情绪影响大
            changePercent = (Math.random() - 0.45) * 0.5; // -25% ~ +27.5%
          }
          break;

        case 'medium': // 上岸必胜 - 中等波动 + 周期性
          // 基础波动
          const baseChange = (Math.random() - 0.5) * 0.2; // -10% ~ +10%

          // 周期性：随着游戏天数推进，期末/校招季临近价格上涨
          const dayProgress = currentDay / totalDays;
          const cyclicalBonus = dayProgress * 0.01; // 每天额外0.01%上涨趋势

          // 智力加成：智力越高越稳定且倾向于上涨
          const intelligenceBonus = Math.min((intelligence - 10) * 0.005, 0.05);

          changePercent = baseChange + cyclicalBonus + intelligenceBonus;
          break;

        case 'stable': // 基建稳健 - 极低波动
          // 波动控制在 ±1%~±3% 以内
          changePercent = (Math.random() - 0.5) * 0.06;
          break;

        default:
          changePercent = (Math.random() - 0.5) * 0.1;
      }

      const newPrice = Math.max(1, stock.price * (1 + changePercent));

      // 更新连续上涨天数
      const isUp = newPrice > stock.price;
      const newConsecutiveUpDays = isUp ? stock.consecutiveUpDays + 1 : 0;

      return {
        ...stock,
        previousPrice: stock.price,
        price: Number(newPrice.toFixed(2)),
        history: [...stock.history.slice(-6), Number(newPrice.toFixed(2))],
        consecutiveUpDays: newConsecutiveUpDays,
      };
    });

    // 泡沫破裂算法 - 检查连续上涨超过3天的基金
    updatedStocks = updatedStocks.map(stock => {
      if (stock.consecutiveUpDays > 3) {
        // 从第4天开始，每天增加25%的崩盘概率
        const crashChance = Math.min(0.25 * (stock.consecutiveUpDays - 3), 0.95);
        const roll = Math.random();

        if (roll < crashChance) {
          // 触发崩盘：暴跌40%-60%
          const crashPercent = 0.4 + Math.random() * 0.2;
          const crashedPrice = Math.max(1, stock.price * (1 - crashPercent));
          addLog(`[崩盘] ${stock.name} 泡沫破裂！暴跌 ${(crashPercent * 100).toFixed(0)}%`, 'error');
          return {
            ...stock,
            price: Number(crashedPrice.toFixed(2)),
            previousPrice: stock.price,
            history: [...stock.history.slice(-6), Number(crashedPrice.toFixed(2))],
            consecutiveUpDays: 0, // 重置连续上涨天数
          };
        } else if (stock.consecutiveUpDays === 4) {
          // 第一次警告
          addLog(`[警告] ${stock.name} 市场过热，存在崩盘风险！`, 'warning');
        }
      }
      return stock;
    });

    // 处理舍友搬离天数倒计时
    if (roommateGoneDays > 0) {
      const newDays = roommateGoneDays - 1;
      setRoommateGoneDays(newDays);
      if (newDays === 0) {
        addLog('舍友搬回来了...他似乎还记恨着你的举报', 'warning');
      }
    }

    // 触发随机事件（需要特殊处理舍友报复事件）
    let event = generateRandomEvent();

    // 如果是舍友报复事件，检查是否满足触发条件
    if (event.message.includes('舍友的疯狂报复')) {
      if (!justiceMessenger || roommateGoneDays > 0) {
        // 不满足条件，重新生成一个普通事件
        const filteredEvents = [
          '社团招新季到来，校园消费热潮！',
          '天气转凉，校园消费热情下降。',
          '【矿潮来袭】显卡价格暴涨！',
          '【深夜停电】全校停电，硬件需求暴跌！',
          '【新游发布】爆款游戏带动硬件销售！',
          '【显卡价格崩盘】矿难来临，显卡价格暴跌！',
          '【大厂提前批面试】知名企业开启提前批面试！',
          '毕业季临近，求职培训需求激增！',
          '期末考试周临近，上岸必胜基金全面上涨！',
          '知名企业来校宣讲，内卷板块受益！',
          '校园网络升级完成，基建板块受益！',
          '【极端暴雨天气】连续暴雨，基建服务受影响！',
          '学校发布就业报告，整体市场平稳。',
          '【被拉入500人群】精力-20，智力+2',
          easygoing ? '【顺手牵羊】损失¥50' : '学校发布就业报告，整体市场平稳。',
          '【辅导员突击查寝】检查宿舍卫生。',
        ];
        event = {
          message: filteredEvents[Math.floor(Math.random() * filteredEvents.length)],
          impact: () => {}
        } as RandomEvent;
      }
    }

    // 如果是顺手牵羊事件且玩家没有"好说话"标记，有概率替换成普通事件
    if (event.message.includes('顺手牵羊') && !easygoing) {
      if (Math.random() > 0.3) {
        // 70%概率不触发
        event = {
          message: '学校发布就业报告，整体市场平稳。',
          impact: () => {}
        } as RandomEvent;
      }
    }

    event.impact(updatedStocks, intelligence);
    setStocks(updatedStocks);
    setNews(event.message);
    addLog(`【${event.message}】`, 'info');

    // 特殊事件的额外日志
    if (event.message.includes('疯狂的宿管阿姨')) {
      const gameStock = updatedStocks.find(s => s.name.includes('赛博消闲'));
      if (gameStock && gameStock.held > 0) {
        addLog(`宿管阿姨没收了你 ${gameStock.held} 股股票型-赛博消闲娱乐ETF（50%），明天需要写检讨消耗2点行动点`, 'warning');
      } else {
        addLog('幸好你没有持有股票型-赛博消闲娱乐ETF，逃过一劫', 'info');
      }
    }
    if (event.message.includes('500人群')) {
      addLog('精力 -20，智力 +2（学会了如何识别垃圾信息）', 'info');
    }
    if (event.message.includes('舍友的疯狂报复')) {
      const heldStocks = updatedStocks.filter(s => s.held > 0);
      if (heldStocks.length > 0) {
        const targetStock = heldStocks[Math.floor(Math.random() * heldStocks.length)];
        const lost = Math.floor(targetStock.held * 0.3);
        addLog(`舍友报复！${targetStock.name} 被恶意操作，损失 ${lost} 股（30%）`, 'error');
      }
      setJusticeMessenger(false); // 报复后清除标记
    }
    if (event.message.includes('顺手牵羊')) {
      addLog('损失¥50（因为舍友觉得你"好说话"）', 'warning');
    }
    if (event.message.includes('辅导员突击查寝')) {
      if (hasBadReputation && Math.random() < 0.3) {
        setCash(prev => Math.max(0, prev - 100));
        addLog('你被判定为从犯，罚款¥100！', 'error');
      } else {
        addLog('检查结束，一切正常', 'info');
      }
    }

    setStocks(updatedStocks);

    // 清空明日预测
    setTomorrowForecast([]);

    // 更新好人卡天数
    if (goodCardDays > 0) {
      setGoodCardDays(prev => prev - 1);
    }

    // 基金复利分红系统 - 所有基金都是基金
    updatedStocks.forEach(fund => {
      if (fund.held > 0) {
        const newHoldingDays = (fund.holdingDays || 0) + 1;

        // 持有超过3天，享受分红
        if (newHoldingDays > 3) {
          // 分红比例：智力>80时0.5%，否则0.3%
          const dividendRate = intelligence > 80 ? 0.005 : 0.003;
          const dividend = fund.held * fund.price * dividendRate;

          if (dividend > 0) {
            setCash(prev => prev + dividend);
            const rateText = (dividendRate * 100).toFixed(1);
            addLog(`【基金分红】${fund.name} 分红 ¥${dividend.toFixed(2)}（${rateText}%）持有${newHoldingDays}天`, 'success');
          }
        }

        // 更新基金的持有天数
        updatedStocks = updatedStocks.map(s =>
          s.id === fund.id ? { ...s, holdingDays: newHoldingDays } : s
        );
      }
    });

    setStocks(updatedStocks);

    // 生成并触发财富招忌事件
    const wealthEvent = generateWealthEvent();
    if (wealthEvent) {
      setCurrentChoiceEvent(wealthEvent);
      // 如果是电脑蓝屏事件，需要锁定交易直到玩家选择维修
      if (wealthEvent.id === 'computer-crash') {
        setTradingLocked(true);
      }
      return; // 暂停结算，等待玩家选择
    }

    // 进入下一天
    const nextDay = currentDay + 1;
    setCurrentDay(nextDay);

    // 生成当天的新闻
    const dailyNews = generateDailyNews();
    setNews(dailyNews);

    // 重置行动点，应用写检讨惩罚
    const finalActionPoints = Math.max(0, maxActionPoints - apologyPenalty);
    setActionPoints(finalActionPoints);
    if (apologyPenalty > 0) {
      addLog(`【写检讨】宿管阿姨要求写检讨，行动点 -${apologyPenalty}`, 'warning');
      setApologyPenalty(0); // 重置惩罚
    }

    // 检查游戏胜利
    if (nextDay > totalDays) {
      const totalAssets = calculateTotalAssets();
      if (totalAssets >= 2000) {
        addLog(`恭喜！28天结束，总资产 ¥${totalAssets.toFixed(2)}，你成为了寝室大亨！`, 'success');
      } else {
        addLog(`28天结束，总资产 ¥${totalAssets.toFixed(2)}，继续努力！`, 'info');
      }
      setGameOver(true);
    } else {
      addLog(`=== 第 ${nextDay} 天 ===`, 'info');
      // 触发每日新闻弹窗
      setPendingNews(dailyNews);
      setShowDailyNews(true);
    }
  };

  // 渲染价格走势图
  const renderChart = (stock: Stock) => {
    const max = Math.max(...stock.history);
    const min = Math.min(...stock.history);
    const range = max - min || 1;

    return (
      <div className="flex items-end gap-0.5 h-12 mt-2">
        {stock.history.map((price, idx) => {
          const height = ((price - min) / range) * 100;
          const isUp = idx > 0 && price >= stock.history[idx - 1];
          return (
            <div
              key={idx}
              className="flex-1 rounded-t transition-all duration-300"
              style={{
                height: `${Math.max(10, height)}%`,
                backgroundColor: isUp ? '#ef4444' : '#22c55e', // 红涨绿跌
              }}
            />
          );
        })}
      </div>
    );
  };

  if (gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E0F7FA] via-[#F3E5F5] to-[#FCE4EC] flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">游戏结束</h1>
          <p className="text-xl mb-2 text-gray-800">总资产: ¥{calculateTotalAssets().toFixed(2)}</p>
          <p className="text-gray-600 mb-6">持续了 {currentDay} 天</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
          >
            重新开始
          </button>
        </div>
      </div>
    );
  }

  // 欢迎页面
  if (!isGameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E0F7FA] via-[#F3E5F5] to-[#FCE4EC] flex items-center justify-center p-4 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-32 h-32 bg-pink-300/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-purple-300/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl"></div>
        </div>

        {/* 欢迎页面内容 */}
        <div className="relative z-10 max-w-4xl w-full">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-2xl border border-pink-200">
            {/* 标题 */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                寝室大亨
              </h1>
              <p className="text-xl md:text-2xl text-gray-800 font-semibold">
                28天生存挑战
              </p>
              <p className="text-sm text-gray-600 mt-2">
                从¥500到¥2000的理财之路
              </p>
            </div>

            {/* 游戏规则 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* 目标 */}
              <div className="bg-white rounded-lg p-6 border-2 border-yellow-200 hover:border-yellow-400 transition shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="text-lg font-bold text-yellow-700">目标</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  作为刚入学的大学生，需在28天内通过投资与兼职，将<span className="text-green-600 font-semibold">¥500</span>变成<span className="text-green-600 font-semibold">¥2000</span>。注意：不能因精力耗尽或欠债而"退学"。
                </p>
              </div>

              {/* 行动力限制 */}
              <div className="bg-white rounded-lg p-6 border-2 border-blue-200 hover:border-blue-400 transition shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <h3 className="text-lg font-bold text-blue-700">行动力限制</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  每天只有<span className="text-blue-600 font-semibold">2次行动机会</span>（消耗行动点）。请在兼职赚钱、图书馆学习、市场调研间做出权衡。
                </p>
              </div>

              {/* 投资逻辑 */}
              <div className="bg-white rounded-lg p-6 border-2 border-purple-200 hover:border-purple-400 transition shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📈</span>
                  </div>
                  <h3 className="text-lg font-bold text-purple-700">投资逻辑</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  个股（如显卡、奶茶）波动剧烈，混合基金相对稳健。注意：<span className="text-purple-600 font-semibold">你的智力值越高</span>，能操控的资金规模就越大。
                </p>
              </div>

              {/* 生存警示 */}
              <div className="bg-white rounded-lg p-6 border-2 border-red-200 hover:border-red-400 transition shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <h3 className="text-lg font-bold text-red-700">生存警示</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  每天会扣除<span className="text-red-600 font-semibold">¥30生活费</span>。资产翻倍会触发更多校园突发事件。请时刻关注你的精力值，归零即意味着游戏结束。
                </p>
              </div>
            </div>

            {/* 开始按钮 */}
            <div className="text-center">
              <button
                onClick={() => {
                  setIsGameStarted(true);
                  setLogs([{ id: 1, day: 1, message: '欢迎来到寝室大亨！你的28天理财挑战开始了！', type: 'info' }]);
                }}
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg font-bold text-lg transition-all animate-bounce hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <span className="flex items-center gap-2">
                  <span>🚀</span>
                  <span>开启校园生活</span>
                </span>
              </button>
              <p className="text-xs text-gray-500 mt-4">点击开始你的理财之旅</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E0F7FA] via-[#F3E5F5] to-[#FCE4EC] text-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* 顶部状态栏 */}
        <div className="bg-white rounded-lg p-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <DollarSign className="text-green-600" size={24} />
              <div>
                <p className="text-xs text-gray-600">现金</p>
                <p className="text-xl font-bold text-gray-900">¥{cash.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="text-yellow-600" size={24} />
              <div>
                <p className="text-xs text-gray-600">精力</p>
                <p className="text-xl font-bold text-gray-900">{energy}/{100 + maxEnergyBonus}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="text-blue-600" size={24} />
              <div>
                <p className="text-xs text-gray-600">智力</p>
                <p className="text-xl font-bold text-gray-900">{intelligence}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div>
                <p className="text-xs text-gray-600">行动点</p>
                <div className="flex gap-1 items-center">
                  {Array.from({ length: maxActionPoints }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-all ${
                        i < actionPoints ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            {goodCardDays > 0 && (
              <div className="flex items-center gap-2 bg-pink-600 px-3 py-1 rounded-lg">
                <span className="text-sm text-white">💳 好人卡</span>
                <span className="text-sm font-bold text-white">{goodCardDays}天</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Calendar className="text-purple-600" size={24} />
              <div>
                <p className="text-xs text-gray-600">天数</p>
                <p className="text-xl font-bold text-gray-900">{currentDay}/{totalDays}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">单股持仓上限</p>
              <p className="text-xl font-bold text-cyan-600">{getMaxHolding()} 股</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">总资产</p>
            <p className="text-xl font-bold text-green-600">¥{calculateTotalAssets().toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 左侧交易区 */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp size={24} />
              股市交易
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stocks.map(stock => {
                const changePercent = ((stock.price - stock.previousPrice) / stock.previousPrice) * 100;
                const isUp = changePercent >= 0;

                // 板块颜色 - 马卡龙配色
                const sectorColors: Record<Sector, string> = {
                  '内卷': 'bg-[#B2DFDB]',
                  '消费': 'bg-[#F8BBD0]',
                  '基建': 'bg-[#BBDEFB]',
                  '硬件': 'bg-[#FFCCBC]',
                };

                // 持仓上限和泡沫警告
                const maxHolding = getMaxHolding();
                const holdingPercentage = (stock.held / maxHolding) * 100;
                const isNearLimit = holdingPercentage >= 80;
                const isBubbleRisk = stock.consecutiveUpDays >= 3;

                return (
                  <div
                    key={stock.id}
                    className={`rounded-lg p-3 space-y-2 shadow-md bg-gradient-to-br from-amber-100 to-yellow-100 border-2 border-amber-300 ${isBubbleRisk ? 'ring-2 ring-red-500' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded ${sectorColors[stock.sector]} text-gray-800`}>
                            {stock.sector}
                          </span>
                          {stock.type && (
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-500 text-white font-bold">
                              {stock.type}
                            </span>
                          )}
                          {stock.riskLevel && (
                            <span className="text-xs px-2 py-0.5 rounded bg-purple-500 text-white font-bold">
                              {stock.riskLevel}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-sm mt-1 text-amber-900">{stock.name}</h3>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {isUp ? (
                          <TrendingUp className="text-red-600" size={16} />
                        ) : (
                          <TrendingDown className="text-green-600" size={16} />
                        )}
                        {isBubbleRisk && (
                          <span className="text-xs text-red-600 font-bold">⚠️ 泡沫</span>
                        )}
                        {stock.holdingDays !== undefined && stock.holdingDays > 0 && (
                          <span className="text-xs text-amber-700">📅 {stock.holdingDays}天</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xl font-bold text-amber-900">¥{stock.price.toFixed(2)}</p>
                      <p className={`text-xs ${isUp ? 'text-red-600' : 'text-green-600'}`}>
                        {isUp ? '+' : ''}{changePercent.toFixed(2)}%
                      </p>
                    </div>

                    {renderChart(stock)}

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>持仓: {stock.held}/{maxHolding}</span>
                        {stock.consecutiveUpDays > 0 && (
                          <span className={stock.consecutiveUpDays >= 3 ? 'text-red-600' : 'text-gray-600'}>
                            ↑{stock.consecutiveUpDays}天
                          </span>
                        )}
                      </div>
                      {/* 持仓进度条 */}
                      <div className="w-full bg-gray-300 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            isNearLimit ? 'bg-red-500' : holdingPercentage >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(holdingPercentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => buyStock(stock.id)}
                        disabled={cash < stock.price || stock.held >= maxHolding}
                        className="flex-1 py-1.5 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded font-semibold transition text-white"
                      >
                        买入
                      </button>
                      <button
                        onClick={() => sellStock(stock.id)}
                        disabled={stock.held <= 0}
                        className="flex-1 py-1.5 text-sm bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded font-semibold transition text-white"
                      >
                        卖出
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 右侧行动区 */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Briefcase size={24} />
              每日行动
            </h2>

            <div className="bg-white rounded-lg p-4 space-y-3 shadow-md">
              <button
                onClick={doPartTimeJob}
                disabled={energy < 30 || actionPoints <= 0}
                className="w-full py-3 bg-[#e0f7fa] hover:bg-[#b2ebf2] disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg font-semibold transition flex items-center justify-center gap-2 text-gray-800"
              >
                <Briefcase size={20} />
                兼职工作 (-30精力, -1行动点)
              </button>
              <button
                onClick={doStudy}
                disabled={energy < Math.floor(40 * studyCostMultiplier) || actionPoints <= 0}
                className="w-full py-3 bg-[#e0f7fa] hover:bg-[#b2ebf2] disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg font-semibold transition flex items-center justify-center gap-2 text-gray-800"
              >
                <BookOpen size={20} />
                努力学习 (-{Math.floor(40 * studyCostMultiplier)}精力, -1行动点
                {studyCostMultiplier > 1 && <span className="text-orange-600 text-xs">x{studyCostMultiplier}</span>})
              </button>
              <button
                onClick={doResearch}
                disabled={energy < 20 || actionPoints <= 0}
                className="w-full py-3 bg-[#e0f7fa] hover:bg-[#b2ebf2] disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg font-semibold transition flex items-center justify-center gap-2 text-gray-800"
              >
                <Search size={20} />
                市场调研 (-20精力, -1行动点)
              </button>
              <button
                onClick={doRest}
                className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 text-gray-800 ${
                  actionPoints === 0
                    ? 'bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500 animate-pulse shadow-lg shadow-green-500/50'
                    : 'bg-[#e0f7fa] hover:bg-[#b2ebf2]'
                }`}
              >
                <Moon size={20} />
                休息 (+50精力)
                {actionPoints === 0 && <span className="text-xs ml-2">→ 结束今天</span>}
              </button>
            </div>

            {/* 每日新闻 */}
            <div className="bg-white rounded-lg p-4 shadow-md">
              <h3 className="font-bold mb-2 flex items-center gap-2 text-gray-900">
                <Newspaper size={20} />
                每日新闻
              </h3>
              <p className="text-sm text-gray-700">{news}</p>
            </div>

            {/* 明日预测 */}
            {tomorrowForecast.length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-md">
                <h3 className="font-bold mb-2 flex items-center gap-2 text-gray-900">
                  <Search size={20} />
                  明日走势预测
                </h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  {tomorrowForecast.map((forecast, idx) => (
                    <li key={idx}>• {forecast}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 结束今日按钮 */}
        <div className="flex justify-center">
          <button
            onClick={endDay}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-lg font-bold text-lg transition flex items-center gap-2 shadow-lg"
          >
            <LogOut size={24} />
            结束这一天
          </button>
        </div>

        {/* 底部日志 */}
        <div className="bg-white rounded-lg p-4 shadow-md">
          <h2 className="text-xl font-bold mb-3 text-gray-900">操作日志</h2>
          <div className="h-48 overflow-y-auto space-y-2 text-sm">
            {logs.slice().reverse().map(log => {
              const colorClass = {
                info: 'text-blue-600',
                success: 'text-green-600',
                warning: 'text-yellow-600',
                error: 'text-red-600',
              }[log.type];

              return (
                <div key={log.id} className={colorClass}>
                  <span className="text-gray-500">[第{log.day}天]</span> {log.message}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 智力不足弹窗 */}
      {intelligenceAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full border-2 border-yellow-500 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-yellow-600" size={32} />
              <h3 className="text-xl font-bold text-yellow-600">智力不足警告</h3>
            </div>
            <p className="text-gray-700 mb-6">
              你的智力值不足以驾驭更多资产，快去图书馆学习！
            </p>
            <div className="bg-white rounded p-4 mb-4 shadow">
              <p className="text-sm text-gray-600">当前智力: {intelligence}</p>
              <p className="text-sm text-gray-600">单股持仓上限: {getMaxHolding()} 股</p>
              <p className="text-sm text-cyan-600 mt-2">提示：努力学习可提升智力，增加持仓上限</p>
            </div>
            <button
              onClick={() => setIntelligenceAlert(false)}
              className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition"
            >
              知道了
            </button>
          </div>
        </div>
      )}

      {/* 抉择事件弹窗 */}
      {currentChoiceEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-lg p-6 ${currentChoiceEvent.optionC ? 'max-w-2xl' : 'max-w-lg'} w-full border-2 border-orange-500 shadow-xl`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-orange-600">{currentChoiceEvent.title}</h3>
            </div>
            <p className="text-gray-700 mb-6 text-lg">{currentChoiceEvent.description}</p>
            <div className="space-y-3">
              <button
                onClick={() => handleChoice('A')}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition text-left px-6"
              >
                <div className="font-bold mb-1">A. {currentChoiceEvent.optionA.text.split('(')[0]}</div>
                <div className="text-sm text-blue-100">({currentChoiceEvent.optionA.text.split('(')[1]}</div>
              </button>
              <button
                onClick={() => handleChoice('B')}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition text-left px-6"
              >
                <div className="font-bold mb-1">B. {currentChoiceEvent.optionB.text.split('(')[0]}</div>
                <div className="text-sm text-red-100">({currentChoiceEvent.optionB.text.split('(')[1]}</div>
              </button>
              {currentChoiceEvent.optionC && (
                <button
                  onClick={() => handleChoice('C')}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition text-left px-6"
                >
                  <div className="font-bold mb-1">C. {currentChoiceEvent.optionC.text.split('(')[0]}</div>
                  <div className="text-sm text-purple-100">({currentChoiceEvent.optionC.text.split('(')[1]}</div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 每日新闻弹窗 */}
      {showDailyNews && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full border-2 border-blue-500 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-blue-600">📰 每日校园新闻</h3>
              <div className="text-sm text-gray-500">第 {currentDay} 天</div>
            </div>
            <p className="text-gray-700 mb-6 text-lg leading-relaxed">{pendingNews}</p>
            <button
              onClick={() => setShowDailyNews(false)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
            >
              开始新的一天
            </button>
          </div>
        </div>
      )}

      {/* 行动点不足提示 */}
      {actionToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white border-2 border-red-500 rounded-lg px-6 py-4 z-50 animate-bounce shadow-xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600" size={24} />
            <p className="text-gray-900 font-semibold">今天的行动点已用完，回寝室休息吧！</p>
          </div>
        </div>
      )}
    </div>
  );
}
