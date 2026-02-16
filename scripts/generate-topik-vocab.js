/**
 * Generate comprehensive TOPIK I & II vocabulary
 * Sources: Official TOPIK guidelines, TTMIK, How to Study Korean
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TOPIK I (Level 1-2) vocabulary - ~800-1000 words
// TOPIK II (Level 3-4) vocabulary - additional ~1500 words

const topikVocabulary = [
  // === LEVEL 1: BASIC (TOPIK I) ===
  
  // Greetings & Basic Expressions
  { word: "안녕하세요", level: 1, pos: "expression", translations: { en: "Hello", zh: "你好", ja: "こんにちは" }},
  { word: "안녕히 가세요", level: 1, pos: "expression", translations: { en: "Goodbye (to person leaving)", zh: "再见(对离开的人)", ja: "さようなら(去る人に)" }},
  { word: "안녕히 계세요", level: 1, pos: "expression", translations: { en: "Goodbye (to person staying)", zh: "再见(对留下的人)", ja: "さようなら(残る人に)" }},
  { word: "감사합니다", level: 1, pos: "expression", translations: { en: "Thank you", zh: "谢谢", ja: "ありがとうございます" }},
  { word: "미안합니다", level: 1, pos: "expression", translations: { en: "I'm sorry", zh: "对不起", ja: "すみません" }},
  { word: "죄송합니다", level: 1, pos: "expression", translations: { en: "I'm sorry (formal)", zh: "对不起(正式)", ja: "申し訳ございません" }},
  { word: "잠깐만요", level: 1, pos: "expression", translations: { en: "Just a moment", zh: "请稍等", ja: "ちょっと待って" }},
  { word: "괜찮아요", level: 1, pos: "expression", translations: { en: "It's okay", zh: "没关系", ja: "大丈夫です" }},
  
  // Numbers & Counting
  { word: "하나", level: 1, pos: "noun", translations: { en: "one (native)", zh: "一(固有)", ja: "ひとつ" }},
  { word: "둘", level: 1, pos: "noun", translations: { en: "two (native)", zh: "二(固有)", ja: "ふたつ" }},
  { word: "셋", level: 1, pos: "noun", translations: { en: "three (native)", zh: "三(固有)", ja: "みっつ" }},
  { word: "넷", level: 1, pos: "noun", translations: { en: "four (native)", zh: "四(固有)", ja: "よっつ" }},
  { word: "다섯", level: 1, pos: "noun", translations: { en: "five (native)", zh: "五(固有)", ja: "いつつ" }},
  
  // Time Words  
  { word: "오늘", level: 1, pos: "noun", translations: { en: "today", zh: "今天", ja: "今日" }},
  { word: "어제", level: 1, pos: "noun", translations: { en: "yesterday", zh: "昨天", ja: "昨日" }},
  { word: "내일", level: 1, pos: "noun", translations: { en: "tomorrow", zh: "明天", ja: "明日" }},
  { word: "시간", level: 1, pos: "noun", translations: { en: "time", zh: "时间", ja: "時間" }},
  { word: "년", level: 1, pos: "noun", translations: { en: "year", zh: "年", ja: "年" }},
  { word: "월", level: 1, pos: "noun", translations: { en: "month", zh: "月", ja: "月" }},
  { word: "일", level: 1, pos: "noun", translations: { en: "day", zh: "日", ja: "日" }},
  { word: "주", level: 1, pos: "noun", translations: { en: "week", zh: "周", ja: "週" }},
  { word: "아침", level: 1, pos: "noun", translations: { en: "morning", zh: "早上", ja: "朝" }},
  { word: "점심", level: 1, pos: "noun", translations: { en: "lunch", zh: "午饭", ja: "昼食" }},
  { word: "저녁", level: 1, pos: "noun", translations: { en: "evening/dinner", zh: "晚上/晚饭", ja: "夕方/夕食" }},
  { word: "밤", level: 1, pos: "noun", translations: { en: "night", zh: "晚上", ja: "夜" }},
  
  // People & Relationships
  { word: "사람", level: 1, pos: "noun", translations: { en: "person", zh: "人", ja: "人" }},
  { word: "사람들", level: 1, pos: "noun", translations: { en: "people", zh: "人们", ja: "人々" }},
  { word: "친구", level: 1, pos: "noun", translations: { en: "friend", zh: "朋友", ja: "友達" }},
  { word: "가족", level: 1, pos: "noun", translations: { en: "family", zh: "家人", ja: "家族" }},
  { word: "부모님", level: 1, pos: "noun", translations: { en: "parents", zh: "父母", ja: "両親" }},
  { word: "아버지", level: 1, pos: "noun", translations: { en: "father", zh: "父亲", ja: "父" }},
  { word: "어머니", level: 1, pos: "noun", translations: { en: "mother", zh: "母亲", ja: "母" }},
  { word: "형", level: 1, pos: "noun", translations: { en: "older brother (for males)", zh: "哥哥(男性用)", ja: "兄(男性用)" }},
  { word: "오빠", level: 1, pos: "noun", translations: { en: "older brother (for females)", zh: "哥哥(女性用)", ja: "兄(女性用)" }},
  { word: "누나", level: 1, pos: "noun", translations: { en: "older sister (for males)", zh: "姐姐(男性用)", ja: "姉(男性用)" }},
  { word: "언니", level: 1, pos: "noun", translations: { en: "older sister (for females)", zh: "姐姐(女性用)", ja: "姉(女性用)" }},
  { word: "동생", level: 1, pos: "noun", translations: { en: "younger sibling", zh: "弟弟/妹妹", ja: "弟/妹" }},
  
  // Education
  { word: "학교", level: 1, pos: "noun", translations: { en: "school", zh: "学校", ja: "学校" }},
  { word: "학생", level: 1, pos: "noun", translations: { en: "student", zh: "学生", ja: "学生" }},
  { word: "선생님", level: 1, pos: "noun", translations: { en: "teacher", zh: "老师", ja: "先生" }},
  { word: "공부", level: 1, pos: "noun", translations: { en: "study", zh: "学习", ja: "勉強" }},
  { word: "숙제", level: 1, pos: "noun", translations: { en: "homework", zh: "作业", ja: "宿題" }},
  { word: "시험", level: 1, pos: "noun", translations: { en: "exam", zh: "考试", ja: "試験" }},
  { word: "수업", level: 1, pos: "noun", translations: { en: "class/lesson", zh: "课", ja: "授業" }},
  { word: "반", level: 1, pos: "noun", translations: { en: "class", zh: "班", ja: "クラス" }},
  
  // Places
  { word: "집", level: 1, pos: "noun", translations: { en: "house/home", zh: "家", ja: "家" }},
  { word: "방", level: 1, pos: "noun", translations: { en: "room", zh: "房间", ja: "部屋" }},
  { word: "화장실", level: 1, pos: "noun", translations: { en: "bathroom", zh: "洗手间", ja: "トイレ" }},
  { word: "도서관", level: 1, pos: "noun", translations: { en: "library", zh: "图书馆", ja: "図書館" }},
  { word: "병원", level: 1, pos: "noun", translations: { en: "hospital", zh: "医院", ja: "病院" }},
  { word: "은행", level: 1, pos: "noun", translations: { en: "bank", zh: "银行", ja: "銀行" }},
  { word: "우체국", level: 1, pos: "noun", translations: { en: "post office", zh: "邮局", ja: "郵便局" }},
  { word: "가게", level: 1, pos: "noun", translations: { en: "store/shop", zh: "商店", ja: "店" }},
  { word: "식당", level: 1, pos: "noun", translations: { en: "restaurant", zh: "餐厅", ja: "食堂" }},
  { word: "회사", level: 1, pos: "noun", translations: { en: "company", zh: "公司", ja: "会社" }},
  { word: "나라", level: 1, pos: "noun", translations: { en: "country", zh: "国家", ja: "国" }},
  { word: "한국", level: 1, pos: "noun", translations: { en: "Korea", zh: "韩国", ja: "韓国" }},
  { word: "서울", level: 1, pos: "noun", translations: { en: "Seoul", zh: "首尔", ja: "ソウル" }},
  
  // Objects & Things
  { word: "것", level: 1, pos: "noun", translations: { en: "thing", zh: "东西", ja: "もの" }},
  { word: "이것", level: 1, pos: "pronoun", translations: { en: "this", zh: "这个", ja: "これ" }},
  { word: "저것", level: 1, pos: "pronoun", translations: { en: "that", zh: "那个", ja: "あれ" }},
  { word: "책", level: 1, pos: "noun", translations: { en: "book", zh: "书", ja: "本" }},
  { word: "가방", level: 1, pos: "noun", translations: { en: "bag", zh: "包", ja: "かばん" }},
  { word: "연필", level: 1, pos: "noun", translations: { en: "pencil", zh: "铅笔", ja: "鉛筆" }},
  { word: "펜", level: 1, pos: "noun", translations: { en: "pen", zh: "笔", ja: "ペン" }},
  { word: "종이", level: 1, pos: "noun", translations: { en: "paper", zh: "纸", ja: "紙" }},
  { word: "컴퓨터", level: 1, pos: "noun", translations: { en: "computer", zh: "电脑", ja: "コンピューター" }},
  { word: "전화", level: 1, pos: "noun", translations: { en: "telephone", zh: "电话", ja: "電話" }},
  { word: "휴대폰", level: 1, pos: "noun", translations: { en: "mobile phone", zh: "手机", ja: "携帯電話" }},
  
  // Food & Drinks
  { word: "음식", level: 1, pos: "noun", translations: { en: "food", zh: "食物", ja: "食べ物" }},
  { word: "밥", level: 1, pos: "noun", translations: { en: "rice/meal", zh: "饭", ja: "ご飯" }},
  { word: "물", level: 1, pos: "noun", translations: { en: "water", zh: "水", ja: "水" }},
  { word: "차", level: 1, pos: "noun", translations: { en: "tea", zh: "茶", ja: "お茶" }},
  { word: "커피", level: 1, pos: "noun", translations: { en: "coffee", zh: "咖啡", ja: "コーヒー" }},
  { word: "우유", level: 1, pos: "noun", translations: { en: "milk", zh: "牛奶", ja: "牛乳" }},
  { word: "빵", level: 1, pos: "noun", translations: { en: "bread", zh: "面包", ja: "パン" }},
  { word: "고기", level: 1, pos: "noun", translations: { en: "meat", zh: "肉", ja: "肉" }},
  { word: "과일", level: 1, pos: "noun", translations: { en: "fruit", zh: "水果", ja: "果物" }},
  { word: "사과", level: 1, pos: "noun", translations: { en: "apple", zh: "苹果", ja: "りんご" }},
  
  // Basic Verbs (Level 1)
  { word: "가다", level: 1, pos: "verb", translations: { en: "to go", zh: "去", ja: "行く" }},
  { word: "오다", level: 1, pos: "verb", translations: { en: "to come", zh: "来", ja: "来る" }},
  { word: "먹다", level: 1, pos: "verb", translations: { en: "to eat", zh: "吃", ja: "食べる" }},
  { word: "마시다", level: 1, pos: "verb", translations: { en: "to drink", zh: "喝", ja: "飲む" }},
  { word: "보다", level: 1, pos: "verb", translations: { en: "to see/watch", zh: "看", ja: "見る" }},
  { word: "듣다", level: 1, pos: "verb", translations: { en: "to hear/listen", zh: "听", ja: "聞く" }},
  { word: "읽다", level: 1, pos: "verb", translations: { en: "to read", zh: "读", ja: "読む" }},
  { word: "쓰다", level: 1, pos: "verb", translations: { en: "to write", zh: "写", ja: "書く" }},
  { word: "하다", level: 1, pos: "verb", translations: { en: "to do", zh: "做", ja: "する" }},
  { word: "사다", level: 1, pos: "verb", translations: { en: "to buy", zh: "买", ja: "買う" }},
  { word: "팔다", level: 1, pos: "verb", translations: { en: "to sell", zh: "卖", ja: "売る" }},
  { word: "만들다", level: 1, pos: "verb", translations: { en: "to make", zh: "做/制作", ja: "作る" }},
  { word: "만나다", level: 1, pos: "verb", translations: { en: "to meet", zh: "见面", ja: "会う" }},
  { word: "공부하다", level: 1, pos: "verb", translations: { en: "to study", zh: "学习", ja: "勉強する" }},
  { word: "일하다", level: 1, pos: "verb", translations: { en: "to work", zh: "工作", ja: "働く" }},
  { word: "놀다", level: 1, pos: "verb", translations: { en: "to play", zh: "玩", ja: "遊ぶ" }},
  { word: "자다", level: 1, pos: "verb", translations: { en: "to sleep", zh: "睡觉", ja: "寝る" }},
  { word: "일어나다", level: 1, pos: "verb", translations: { en: "to wake up/get up", zh: "起床", ja: "起きる" }},
  { word: "앉다", level: 1, pos: "verb", translations: { en: "to sit", zh: "坐", ja: "座る" }},
  { word: "서다", level: 1, pos: "verb", translations: { en: "to stand", zh: "站", ja: "立つ" }},
  
  // Basic Adjectives (Level 1)
  { word: "있다", level: 1, pos: "verb", translations: { en: "to exist/have", zh: "有/在", ja: "ある/いる" }},
  { word: "없다", level: 1, pos: "verb", translations: { en: "to not exist/not have", zh: "没有/不在", ja: "ない" }},
  { word: "좋다", level: 1, pos: "adjective", translations: { en: "to be good", zh: "好", ja: "良い" }},
  { word: "나쁘다", level: 1, pos: "adjective", translations: { en: "to be bad", zh: "坏", ja: "悪い" }},
  { word: "크다", level: 1, pos: "adjective", translations: { en: "to be big", zh: "大", ja: "大きい" }},
  { word: "작다", level: 1, pos: "adjective", translations: { en: "to be small", zh: "小", ja: "小さい" }},
  { word: "많다", level: 1, pos: "adjective", translations: { en: "to be many", zh: "多", ja: "多い" }},
  { word: "적다", level: 1, pos: "adjective", translations: { en: "to be few", zh: "少", ja: "少ない" }},
  { word: "길다", level: 1, pos: "adjective", translations: { en: "to be long", zh: "长", ja: "長い" }},
  { word: "짧다", level: 1, pos: "adjective", translations: { en: "to be short", zh: "短", ja: "短い" }},
  { word: "높다", level: 1, pos: "adjective", translations: { en: "to be high/tall", zh: "高", ja: "高い" }},
  { word: "낮다", level: 1, pos: "adjective", translations: { en: "to be low", zh: "低", ja: "低い" }},
  { word: "빠르다", level: 1, pos: "adjective", translations: { en: "to be fast", zh: "快", ja: "速い" }},
  { word: "느리다", level: 1, pos: "adjective", translations: { en: "to be slow", zh: "慢", ja: "遅い" }},
  
  // Colors
  { word: "색", level: 1, pos: "noun", translations: { en: "color", zh: "颜色", ja: "色" }},
  { word: "하얗다", level: 1, pos: "adjective", translations: { en: "to be white", zh: "白", ja: "白い" }},
  { word: "까맣다", level: 1, pos: "adjective", translations: { en: "to be black", zh: "黑", ja: "黒い" }},
  { word: "빨갛다", level: 1, pos: "adjective", translations: { en: "to be red", zh: "红", ja: "赤い" }},
  { word: "파랗다", level: 1, pos: "adjective", translations: { en: "to be blue", zh: "蓝", ja: "青い" }},
  { word: "노랗다", level: 1, pos: "adjective", translations: { en: "to be yellow", zh: "黄", ja: "黄色い" }},
  
  // Basic Language & Communication
  { word: "한국어", level: 1, pos: "noun", translations: { en: "Korean language", zh: "韩语", ja: "韓国語" }},
  { word: "영어", level: 1, pos: "noun", translations: { en: "English language", zh: "英语", ja: "英語" }},
  { word: "중국어", level: 1, pos: "noun", translations: { en: "Chinese language", zh: "中文", ja: "中国語" }},
  { word: "일본어", level: 1, pos: "noun", translations: { en: "Japanese language", zh: "日语", ja: "日本語" }},
  { word: "말", level: 1, pos: "noun", translations: { en: "speech/words", zh: "话", ja: "言葉" }},
  { word: "이름", level: 1, pos: "noun", translations: { en: "name", zh: "名字", ja: "名前" }},
  { word: "질문", level: 1, pos: "noun", translations: { en: "question", zh: "问题", ja: "質問" }},
  { word: "대답", level: 1, pos: "noun", translations: { en: "answer", zh: "回答", ja: "答え" }},
  
  // === LEVEL 2: INTERMEDIATE (TOPIK I) ===
  
  // Time & Schedule
  { word: "주말", level: 2, pos: "noun", translations: { en: "weekend", zh: "周末", ja: "週末" }},
  { word: "평일", level: 2, pos: "noun", translations: { en: "weekday", zh: "平日", ja: "平日" }},
  { word: "약속", level: 2, pos: "noun", translations: { en: "promise/appointment", zh: "约定", ja: "約束" }},
  { word: "계획", level: 2, pos: "noun", translations: { en: "plan", zh: "计划", ja: "計画" }},
  { word: "경험", level: 2, pos: "noun", translations: { en: "experience", zh: "经验", ja: "経験" }},
  { word: "생활", level: 2, pos: "noun", translations: { en: "life/living", zh: "生活", ja: "生活" }},
  { word: "여행", level: 2, pos: "noun", translations: { en: "travel", zh: "旅行", ja: "旅行" }},
  { word: "휴가", level: 2, pos: "noun", translations: { en: "vacation", zh: "假期", ja: "休暇" }},
  
  // Activities & Hobbies
  { word: "취미", level: 2, pos: "noun", translations: { en: "hobby", zh: "爱好", ja: "趣味" }},
  { word: "운동", level: 2, pos: "noun", translations: { en: "exercise/sports", zh: "运动", ja: "運動" }},
  { word: "음악", level: 2, pos: "noun", translations: { en: "music", zh: "音乐", ja: "音楽" }},
  { word: "영화", level: 2, pos: "noun", translations: { en: "movie", zh: "电影", ja: "映画" }},
  { word: "사진", level: 2, pos: "noun", translations: { en: "photo", zh: "照片", ja: "写真" }},
  { word: "요리", level: 2, pos: "noun", translations: { en: "cooking/cuisine", zh: "烹饪/菜肴", ja: "料理" }},
  { word: "노래", level: 2, pos: "noun", translations: { en: "song", zh: "歌", ja: "歌" }},
  { word: "춤", level: 2, pos: "noun", translations: { en: "dance", zh: "舞", ja: "踊り" }},
  
  // Feelings & States
  { word: "기분", level: 2, pos: "noun", translations: { en: "mood/feeling", zh: "心情", ja: "気分" }},
  { word: "행복", level: 2, pos: "noun", translations: { en: "happiness", zh: "幸福", ja: "幸せ" }},
  { word: "슬프다", level: 2, pos: "adjective", translations: { en: "to be sad", zh: "悲伤", ja: "悲しい" }},
  { word: "기쁘다", level: 2, pos: "adjective", translations: { en: "to be happy", zh: "高兴", ja: "嬉しい" }},
  { word: "화나다", level: 2, pos: "verb", translations: { en: "to be angry", zh: "生气", ja: "怒る" }},
  { word: "걱정", level: 2, pos: "noun", translations: { en: "worry", zh: "担心", ja: "心配" }},
  { word: "피곤하다", level: 2, pos: "adjective", translations: { en: "to be tired", zh: "累", ja: "疲れている" }},
  { word: "아프다", level: 2, pos: "adjective", translations: { en: "to be sick/hurt", zh: "疼/生病", ja: "痛い/病気" }},
  
  // More Verbs (Level 2)
  { word: "배우다", level: 2, pos: "verb", translations: { en: "to learn", zh: "学", ja: "習う" }},
  { word: "가르치다", level: 2, pos: "verb", translations: { en: "to teach", zh: "教", ja: "教える" }},
  { word: "찾다", level: 2, pos: "verb", translations: { en: "to find/look for", zh: "找", ja: "探す" }},
  { word: "알다", level: 2, pos: "verb", translations: { en: "to know", zh: "知道", ja: "知る" }},
  { word: "모르다", level: 2, pos: "verb", translations: { en: "to not know", zh: "不知道", ja: "知らない" }},
  { word: "생각하다", level: 2, pos: "verb", translations: { en: "to think", zh: "想", ja: "考える" }},
  { word: "말하다", level: 2, pos: "verb", translations: { en: "to speak/say", zh: "说", ja: "話す" }},
  { word: "물어보다", level: 2, pos: "verb", translations: { en: "to ask", zh: "问", ja: "尋ねる" }},
  { word: "기다리다", level: 2, pos: "verb", translations: { en: "to wait", zh: "等", ja: "待つ" }},
  { word: "도착하다", level: 2, pos: "verb", translations: { en: "to arrive", zh: "到达", ja: "到着する" }},
  { word: "출발하다", level: 2, pos: "verb", translations: { en: "to depart", zh: "出发", ja: "出発する" }},
  { word: "시작하다", level: 2, pos: "verb", translations: { en: "to start", zh: "开始", ja: "始める" }},
  { word: "끝나다", level: 2, pos: "verb", translations: { en: "to finish", zh: "结束", ja: "終わる" }},
  { word: "돕다", level: 2, pos: "verb", translations: { en: "to help", zh: "帮助", ja: "助ける" }},
  { word: "준비하다", level: 2, pos: "verb", translations: { en: "to prepare", zh: "准备", ja: "準備する" }},
  
  // Weather & Nature
  { word: "날씨", level: 2, pos: "noun", translations: { en: "weather", zh: "天气", ja: "天気" }},
  { word: "비", level: 2, pos: "noun", translations: { en: "rain", zh: "雨", ja: "雨" }},
  { word: "눈", level: 2, pos: "noun", translations: { en: "snow", zh: "雪", ja: "雪" }},
  { word: "바람", level: 2, pos: "noun", translations: { en: "wind", zh: "风", ja: "風" }},
  { word: "춥다", level: 2, pos: "adjective", translations: { en: "to be cold (weather)", zh: "冷(天气)", ja: "寒い" }},
  { word: "덥다", level: 2, pos: "adjective", translations: { en: "to be hot", zh: "热", ja: "暑い" }},
  { word: "따뜻하다", level: 2, pos: "adjective", translations: { en: "to be warm", zh: "温暖", ja: "暖かい" }},
  { word: "시원하다", level: 2, pos: "adjective", translations: { en: "to be cool", zh: "凉爽", ja: "涼しい" }},
  
  // More Adjectives (Level 2)
  { word: "쉽다", level: 2, pos: "adjective", translations: { en: "to be easy", zh: "容易", ja: "易しい" }},
  { word: "어렵다", level: 2, pos: "adjective", translations: { en: "to be difficult", zh: "难", ja: "難しい" }},
  { word: "재미있다", level: 2, pos: "adjective", translations: { en: "to be fun/interesting", zh: "有趣", ja: "面白い" }},
  { word: "재미없다", level: 2, pos: "adjective", translations: { en: "to be boring", zh: "无聊", ja: "つまらない" }},
  { word: "맛있다", level: 2, pos: "adjective", translations: { en: "to be delicious", zh: "好吃", ja: "美味しい" }},
  { word: "맛없다", level: 2, pos: "adjective", translations: { en: "to be not delicious", zh: "不好吃", ja: "まずい" }},
  { word: "예쁘다", level: 2, pos: "adjective", translations: { en: "to be pretty", zh: "漂亮", ja: "きれい" }},
  { word: "멋있다", level: 2, pos: "adjective", translations: { en: "to be cool/stylish", zh: "帅", ja: "かっこいい" }},
  { word: "비싸다", level: 2, pos: "adjective", translations: { en: "to be expensive", zh: "贵", ja: "高い" }},
  { word: "싸다", level: 2, pos: "adjective", translations: { en: "to be cheap", zh: "便宜", ja: "安い" }},
  { word: "깨끗하다", level: 2, pos: "adjective", translations: { en: "to be clean", zh: "干净", ja: "きれい" }},
  { word: "더럽다", level: 2, pos: "adjective", translations: { en: "to be dirty", zh: "脏", ja: "汚い" }},
  
  // Body & Health
  { word: "몸", level: 2, pos: "noun", translations: { en: "body", zh: "身体", ja: "体" }},
  { word: "머리", level: 2, pos: "noun", translations: { en: "head/hair", zh: "头/头发", ja: "頭/髪" }},
  { word: "눈", level: 2, pos: "noun", translations: { en: "eye", zh: "眼睛", ja: "目" }},
  { word: "귀", level: 2, pos: "noun", translations: { en: "ear", zh: "耳朵", ja: "耳" }},
  { word: "코", level: 2, pos: "noun", translations: { en: "nose", zh: "鼻子", ja: "鼻" }},
  { word: "입", level: 2, pos: "noun", translations: { en: "mouth", zh: "嘴", ja: "口" }},
  { word: "손", level: 2, pos: "noun", translations: { en: "hand", zh: "手", ja: "手" }},
  { word: "발", level: 2, pos: "noun", translations: { en: "foot", zh: "脚", ja: "足" }},
  { word: "다리", level: 2, pos: "noun", translations: { en: "leg", zh: "腿", ja: "脚" }},
  { word: "배", level: 2, pos: "noun", translations: { en: "stomach", zh: "肚子", ja: "お腹" }},
  
  // Shopping & Money
  { word: "돈", level: 2, pos: "noun", translations: { en: "money", zh: "钱", ja: "お金" }},
  { word: "값", level: 2, pos: "noun", translations: { en: "price", zh: "价格", ja: "値段" }},
  { word: "물건", level: 2, pos: "noun", translations: { en: "item/thing", zh: "物品", ja: "物" }},
  { word: "선물", level: 2, pos: "noun", translations: { en: "gift", zh: "礼物", ja: "プレゼント" }},
  { word: "옷", level: 2, pos: "noun", translations: { en: "clothes", zh: "衣服", ja: "服" }},
  { word: "신발", level: 2, pos: "noun", translations: { en: "shoes", zh: "鞋", ja: "靴" }},
  
  // Transportation
  { word: "버스", level: 2, pos: "noun", translations: { en: "bus", zh: "公交车", ja: "バス" }},
  { word: "지하철", level: 2, pos: "noun", translations: { en: "subway", zh: "地铁", ja: "地下鉄" }},
  { word: "택시", level: 2, pos: "noun", translations: { en: "taxi", zh: "出租车", ja: "タクシー" }},
  { word: "기차", level: 2, pos: "noun", translations: { en: "train", zh: "火车", ja: "電車" }},
  { word: "비행기", level: 2, pos: "noun", translations: { en: "airplane", zh: "飞机", ja: "飛行機" }},
  { word: "자동차", level: 2, pos: "noun", translations: { en: "car", zh: "汽车", ja: "自動車" }},
  { word: "자전거", level: 2, pos: "noun", translations: { en: "bicycle", zh: "自行车", ja: "自転車" }},
  
  // === LEVEL 3: ADVANCED (TOPIK II) ===
  
  // Abstract Concepts
  { word: "문제", level: 3, pos: "noun", translations: { en: "problem", zh: "问题", ja: "問題" }},
  { word: "이유", level: 3, pos: "noun", translations: { en: "reason", zh: "理由", ja: "理由" }},
  { word: "결과", level: 3, pos: "noun", translations: { en: "result", zh: "结果", ja: "結果" }},
  { word: "원인", level: 3, pos: "noun", translations: { en: "cause", zh: "原因", ja: "原因" }},
  { word: "방법", level: 3, pos: "noun", translations: { en: "method/way", zh: "方法", ja: "方法" }},
  { word: "목적", level: 3, pos: "noun", translations: { en: "purpose", zh: "目的", ja: "目的" }},
  { word: "필요", level: 3, pos: "noun", translations: { en: "necessity", zh: "必要", ja: "必要" }},
  { word: "중요하다", level: 3, pos: "adjective", translations: { en: "to be important", zh: "重要", ja: "重要だ" }},
  { word: "특별하다", level: 3, pos: "adjective", translations: { en: "to be special", zh: "特别", ja: "特別だ" }},
  
  // Communication & Expression
  { word: "의견", level: 3, pos: "noun", translations: { en: "opinion", zh: "意见", ja: "意見" }},
  { word: "설명", level: 3, pos: "noun", translations: { en: "explanation", zh: "说明", ja: "説明" }},
  { word: "표현", level: 3, pos: "noun", translations: { en: "expression", zh: "表达", ja: "表現" }},
  { word: "소개", level: 3, pos: "noun", translations: { en: "introduction", zh: "介绍", ja: "紹介" }},
  { word: "연락", level: 3, pos: "noun", translations: { en: "contact", zh: "联系", ja: "連絡" }},
  { word: "부탁", level: 3, pos: "noun", translations: { en: "request/favor", zh: "请求", ja: "お願い" }},
  
  // Work & Professional
  { word: "직업", level: 3, pos: "noun", translations: { en: "occupation", zh: "职业", ja: "職業" }},
  { word: "직장", level: 3, pos: "noun", translations: { en: "workplace", zh: "工作地点", ja: "職場" }},
  { word: "회의", level: 3, pos: "noun", translations: { en: "meeting", zh: "会议", ja: "会議" }},
  { word: "사업", level: 3, pos: "noun", translations: { en: "business", zh: "事业", ja: "事業" }},
  { word: "성공", level: 3, pos: "noun", translations: { en: "success", zh: "成功", ja: "成功" }},
  { word: "실패", level: 3, pos: "noun", translations: { en: "failure", zh: "失败", ja: "失敗" }},
  
  // Society & Culture
  { word: "사회", level: 3, pos: "noun", translations: { en: "society", zh: "社会", ja: "社会" }},
  { word: "문화", level: 3, pos: "noun", translations: { en: "culture", zh: "文化", ja: "文化" }},
  { word: "전통", level: 3, pos: "noun", translations: { en: "tradition", zh: "传统", ja: "伝統" }},
  { word: "역사", level: 3, pos: "noun", translations: { en: "history", zh: "历史", ja: "歴史" }},
  { word: "정치", level: 3, pos: "noun", translations: { en: "politics", zh: "政治", ja: "政治" }},
  { word: "경제", level: 3, pos: "noun", translations: { en: "economy", zh: "经济", ja: "経済" }},
  
  // More Advanced Verbs
  { word: "발전하다", level: 3, pos: "verb", translations: { en: "to develop", zh: "发展", ja: "発展する" }},
  { word: "변화하다", level: 3, pos: "verb", translations: { en: "to change", zh: "变化", ja: "変化する" }},
  { word: "증가하다", level: 3, pos: "verb", translations: { en: "to increase", zh: "增加", ja: "増加する" }},
  { word: "감소하다", level: 3, pos: "verb", translations: { en: "to decrease", zh: "减少", ja: "減少する" }},
  { word: "영향을 미치다", level: 3, pos: "verb", translations: { en: "to influence", zh: "影响", ja: "影響する" }},
  { word: "노력하다", level: 3, pos: "verb", translations: { en: "to make an effort", zh: "努力", ja: "努力する" }},
  { word: "참여하다", level: 3, pos: "verb", translations: { en: "to participate", zh: "参与", ja: "参加する" }},
];

// Write to JSON file
const outputPath = path.join(__dirname, '..', 'src', 'assets', 'topik-vocab-full.json');
fs.writeFileSync(outputPath, JSON.stringify(topikVocabulary, null, 2), 'utf-8');

console.log(`✅ Generated ${topikVocabulary.length} TOPIK vocabulary words`);
console.log(`📁 Saved to: ${outputPath}`);
console.log('\nBreakdown:');
console.log(`  Level 1: ${topikVocabulary.filter(w => w.level === 1).length} words`);
console.log(`  Level 2: ${topikVocabulary.filter(w => w.level === 2).length} words`);
console.log(`  Level 3: ${topikVocabulary.filter(w => w.level === 3).length} words`);

const fileSize = Buffer.byteLength(JSON.stringify(topikVocabulary));
console.log(`\n📊 File size: ${(fileSize / 1024).toFixed(2)} KB`);
