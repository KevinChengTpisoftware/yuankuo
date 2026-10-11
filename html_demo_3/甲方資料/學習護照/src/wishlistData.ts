import { WishCard } from './types';

export const WISH_CARDS: WishCard[] = [
  // ==========================================
  // 【食】大飽口福領域（5 張願望圖卡）
  // ==========================================
  {
    id: 'wish-food-01',
    videoUrl: '/videos/wish-food-01.mp4',
    actionVerb: '舀起',
    actionVerbFull: '手握湯匙舀起熱湯麵送入口中',
    animationType: 'scoop-soup',
    imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=700&auto=format&fit=crop&q=80',
    imageAlt: '端起一碗溫暖熱湯麵自立進食情境',
    category: '食',
    title: '自己拿湯匙喝完一碗熱湯麵',
    subtitle: '不再依賴別人餵食，坐姿平穩地享受每一口熱騰騰的滋味與生活尊嚴。',
    icon: '🍜',
    badgeText: '自立進食第一步',
    difficultyLevel: '入門基礎',
    requiredAbilities: {
      posturalMotor: [
        '靜態坐姿平衡可持續至少 15~20 分鐘（雙腳踩地不傾倒）',
        '健側或患側上肢能前屈 45~60 度，平穩將餐具送至口唇前',
        '軀幹在進食過程中能維持微前傾之安全吞嚥保護姿態'
      ],
      handFunction: [
        '健側手（或改裝加粗湯匙之患側手）具備圓柱狀抓握力量',
        '手腕具備基礎背屈與旋後控制，避免舀湯時手腕下垂翻倒',
        '手部穩定度佳，能維持連續 5~10 口送餐不中途脫落'
      ],
      cognitiveSensory: [
        '無顯著口咽期吞嚥困難，進食流質或軟質不嗆咳',
        '具備基本食溫辨識力，避免被剛出爐熱湯燙傷',
        '雙側空間感知正常，能看清碗內所有食物位置'
      ]
    },
    adaptiveStrategies: [
      '使用高邊防溢弧形餐盤或加深碗，協助單手推擠食物入匙',
      '餐碗底部鋪設矽膠止滑墊，防止碗在桌上滑動',
      '使用彎角湯匙（Angled Spoon）減少手腕過度扭轉需求'
    ],
    relatedTaskIds: [1, 2, 4],
    milestoneTaskId: 1
  },
  {
    id: 'wish-food-02',
    videoUrl: '/videos/wish-food-02.mp4',
    actionVerb: '夾取',
    actionVerbFull: '運用筷子穩妥夾取盤中小菜',
    animationType: 'chopsticks',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=700&auto=format&fit=crop&q=80',
    imageAlt: '用筷子精準夾起美味小菜水果情境',
    category: '食',
    title: '用筷子夾起小菜與水果',
    subtitle: '恢復細膩手部協調，隨心所欲挑選喜愛的切塊水果與精緻點心。',
    icon: '🥢',
    badgeText: '精細動作掌控',
    difficultyLevel: '生活自立',
    requiredAbilities: {
      posturalMotor: [
        '良好的手肘旋轉與手腕微調控制',
        '坐姿下軀幹能自由向前探伸並平穩回正'
      ],
      handFunction: [
        '大拇指與食指、中指能形成三指捏握（Tripod pinch）控制',
        '具有單獨伸展與指尖協調釋放物體的能力（Brunnstrom Stage IV 以上）',
        '指力具備適度抓取力道調節，能夾取軟物而不捏碎'
      ],
      cognitiveSensory: [
        '指尖具備淺層觸覺與本體感覺，能感受食物重量與軟硬質地',
        '眼手空間協調精準，能目測距離並準確夾取'
      ]
    },
    adaptiveStrategies: [
      '使用彈簧輔助筷（連結式學習筷），只需壓合即能自動回彈',
      '切塊食物大小控制在 2~3 公分，表面微沾粉質增加摩擦力',
      '筷身加裝軟膠防滑指套，輔助指力不足'
    ],
    relatedTaskIds: [3, 5, 16],
    milestoneTaskId: 3
  },
  {
    id: 'wish-food-03',
    videoUrl: '/videos/wish-food-03.mp4',
    actionVerb: '旋開',
    actionVerbFull: '健側握蓋患側固定旋開水瓶',
    animationType: 'open-bottle',
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=700&auto=format&fit=crop&q=80',
    imageAlt: '旋開瓶蓋享用清涼飲品情境',
    category: '食',
    title: '單手旋開寶特瓶與易開罐',
    subtitle: '口渴時隨時能自主喝水與開飲料，不再需要向旁人求助或漫長等待。',
    icon: '🧃',
    badgeText: '容器解鎖自主',
    difficultyLevel: '入門基礎',
    requiredAbilities: {
      posturalMotor: [
        '動態坐姿平衡，大腿能夾合施力固定瓶身',
        '或患側手臂具備輔助性下壓固定桌面容器之協調力'
      ],
      handFunction: [
        '健側手指具備強力扭轉肌力（Torque force）',
        '指尖指甲能勾扣或使用開罐輔具拉開金屬拉環',
        '患側若有肌力，能作為「輔助穩定手」壓住瓶罐'
      ],
      cognitiveSensory: [
        '雙手協同企劃能力（Bimanual coordination concept）',
        '辨識旋轉方向（順時針緊閉、逆時針解開）之認知概念'
      ]
    },
    adaptiveStrategies: [
      '將寶特瓶夾於雙膝內側固定，健側手單手旋開瓶蓋',
      '利用橡膠防滑布或多功能開蓋器包覆瓶蓋，省力旋開',
      '使用開罐專用匙匙柄勾起易開罐拉環，避免傷及手指指甲'
    ],
    relatedTaskIds: [4, 6, 7],
    milestoneTaskId: 6
  },
  {
    id: 'wish-food-04',
    videoUrl: '/videos/wish-food-04.mp4',
    actionVerb: '沖泡',
    actionVerbFull: '提壺注水穩定傾倒手沖好茶',
    animationType: 'brew-tea',
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=700&auto=format&fit=crop&q=80',
    imageAlt: '在明亮廚房為自己沖泡一壺好茶情境',
    category: '食',
    title: '走進廚房為自己泡茶煮水',
    subtitle: '重新找回對家庭廚房的掌控感，在茶香中享受自己備餐的踏實與幸福。',
    icon: '🍵',
    badgeText: '居家備餐職能',
    difficultyLevel: '生活自立',
    requiredAbilities: {
      posturalMotor: [
        '靜態獨立站立維持至少 5~10 分鐘，雙腳平均負重',
        '站姿下單手離地倒水時，軀幹抗重力穩定度良好',
        '流理台前小碎步側向移位平穩'
      ],
      handFunction: [
        '健側單手具備 1~2 公斤持續提舉與傾倒之肌耐力',
        '倒水傾斜控制細緻，水流均勻不濺灑'
      ],
      cognitiveSensory: [
        '高層次安全意識：辨識高溫熱水、蒸氣危險與防燙警覺',
        '工作記憶正常，記得關閉電熱水瓶或瓦斯爐開關'
      ]
    },
    adaptiveStrategies: [
      '使用傾倒式水壺架（Kettle Tipper），不需舉起熱水壺只需傾斜即可倒水',
      '流理台旁配置高腳吧檯旋轉防滑椅，可坐站交替減少疲倦',
      '水壺僅注入半滿（約 500ml），降低單手負重力矩'
    ],
    relatedTaskIds: [9, 10, 11],
    milestoneTaskId: 10
  },
  {
    id: 'wish-food-05',
    actionVerb: '品嚐',
    actionVerbFull: '從容用餐夾菜品味熱騰騰美食',
    animationType: 'dining',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=700&auto=format&fit=crop&q=80',
    imageAlt: '與家人好友在餐廳圍桌聚餐歡慶情境',
    category: '食',
    title: '跟親友在餐廳圍爐慶祝',
    subtitle: '走出家門與家人朋友共享大餐，自在交談、舉杯歡笑，宣告回歸精彩人生。',
    icon: '🎉',
    badgeText: '終極社交回歸',
    difficultyLevel: '活躍回歸',
    requiredAbilities: {
      posturalMotor: [
        '能適應不同高度與軟硬度的餐廳座椅（木椅、沙發卡座）',
        '連續坐姿 1.5~2 小時不感疲累或脊椎歪斜'
      ],
      handFunction: [
        '在多人共餐節奏中，能流暢使用自主習慣之餐具進食',
        '能單手端起中型杯碗向親友致意舉杯'
      ],
      cognitiveSensory: [
        '能在吵雜喧鬧背景中維持注意力，與身邊親友語言溝通',
        '克服外出進食心理社交焦慮，建立自我接納之心理彈性'
      ]
    },
    adaptiveStrategies: [
      '隨身攜帶輕量折疊式個人習慣輔助餐具袋',
      '預先挑選靠牆或通道寬敞、靠近洗手間的友善餐廳座席',
      '家人或夥伴坐於患側，提供隱形自然的生活支持'
    ],
    relatedTaskIds: [20, 24, 25],
    milestoneTaskId: 25
  },

  // ==========================================
  // 【衣】整齊自信領域（5 張願望圖卡）
  // ==========================================
  {
    id: 'wish-cloth-01',
    actionVerb: '穿套',
    actionVerbFull: '先穿患側衣袖後套頭穿好上衣',
    animationType: 'wear-shirt',
    category: '衣',
    title: '自己穿好圓領上衣與脫下',
    subtitle: '告別天天穿開襟病服的日子，自己俐落地換上喜愛的 T 恤，充滿朝氣迎接每一天。',
    icon: '👕',
    badgeText: '上半身穿脫自理',
    difficultyLevel: '入門基礎',
    requiredAbilities: {
      posturalMotor: [
        '穩定的床邊或椅上無靠背動態坐姿平衡',
        '穿過頭頂時，頸部與軀幹能配合伸展而不後仰傾倒',
        '肩胛骨能適度放鬆，避免患側手臂強烈屈曲痙攣（Flexor synergy）'
      ],
      handFunction: [
        '健側手能靈活運用「患側先穿、患側後脫」之標準動作口訣',
        '能用健側手將患側手臂套入袖管並往上推至肩胛',
        '能將衣領撐開套過頭部後，迅速伸出健側手臂'
      ],
      cognitiveSensory: [
        '空間與身體知覺正常，能正確辨識衣物正反前後與標籤位置',
        '無嚴重單側忽略（Hemispatial neglect），穿衣不遺漏患側衣角'
      ]
    },
    adaptiveStrategies: [
      '挑選大一號、寬領口、彈性佳或吸濕排汗之休閒服飾',
      '坐姿將衣物平鋪於大腿上，領口朝向自己方便確認方向',
      '遵照「先穿患側、後穿健側；先脫健側、後脫患側」之黃金原則'
    ],
    relatedTaskIds: [26, 27, 28, 29],
    milestoneTaskId: 28
  },
  {
    id: 'wish-cloth-02',
    actionVerb: '扣合',
    actionVerbFull: '指尖對掌捏合排釦穿過釦眼',
    animationType: 'buttoning',
    category: '衣',
    title: '輕鬆扣好襯衫排釦與拉鍊',
    subtitle: '重新穿上有領襯衫與夾克外套，釦好每一顆鈕扣，整齊體面重現專業風采。',
    icon: '👔',
    badgeText: '精細儀容掌握',
    difficultyLevel: '生活自立',
    requiredAbilities: {
      posturalMotor: [
        '坐姿或站姿下能低頭注視胸前排釦，前庭平衡良好不眩暈'
      ],
      handFunction: [
        '健側單手具備極佳之指尖對掌與指腹滑動技巧',
        '能用患側手作為輔助穩定底端布料（或使用輔具穿引）',
        '手指有足夠細微力量將鈕扣斜推穿過釦眼'
      ],
      cognitiveSensory: [
        '視覺手眼協調精確，能將排釦由下至上一一對準孔洞',
        '本體感覺良好，無需過度用力拉扯布料'
      ]
    },
    adaptiveStrategies: [
      '使用單手穿扣器（Button Hook），鋼圈穿過釦眼套住鈕扣即可輕鬆拉出',
      '將傳統排釦內裡改縫魔鬼氈（Velcro）或磁吸式暗釦，外觀完全一致',
      '拉鍊頭加裝拉繩或圓環指環，方便單手拉提'
    ],
    relatedTaskIds: [34, 35, 42],
    milestoneTaskId: 34
  },
  {
    id: 'wish-cloth-03',
    actionVerb: '提穿',
    actionVerbFull: '坐姿穿進褲管站穩拉上褲頭',
    animationType: 'pants',
    category: '衣',
    title: '獨立穿好長褲與提起拉鍊',
    subtitle: '在臥室獨立完成下身穿搭，從坐姿到安全站立拉上褲頭，保有個人最大隱私。',
    icon: '👖',
    badgeText: '下肢穿著自立',
    difficultyLevel: '生活自立',
    requiredAbilities: {
      posturalMotor: [
        '動態坐姿下能將患側腿跨於健側膝上（翹二郎腿姿態）',
        '具備雙腳承重短暫站立能力（至少 10~15 秒），供單手拉提褲頭',
        '骨盆前傾與下肢伸肌力量足以支持重心微移'
      ],
      handFunction: [
        '健側手能單手提拉厚重牛仔布或休閒褲腰圍',
        '手指能操作褲頭鬆緊帶、勾扣或拉鍊拉環'
      ],
      cognitiveSensory: [
        '下肢位置感知清楚，確保雙腳分別進入兩側正確褲管',
        '站立拉褲時對後方跌倒風險具備防範防墜警覺'
      ]
    },
    adaptiveStrategies: [
      '採坐姿預先將雙腳穿過褲管並拉至大腿中段，再背靠穩固床沿站起拉正',
      '選擇腰圍全鬆緊帶設計之休閒彈性褲，免除拉鍊與鈕扣困擾',
      '利用穿衣長桿（Dressing Stick）協助勾拉患側褲管邊緣'
    ],
    relatedTaskIds: [30, 32, 33],
    milestoneTaskId: 33
  },
  {
    id: 'wish-cloth-04',
    actionVerb: '套穿',
    actionVerbFull: '使用鞋拔足跟順勢滑入包鞋',
    animationType: 'shoes',
    category: '衣',
    title: '自己穿好襪子與魔鬼氈球鞋',
    subtitle: '腳步不再需要家人代勞，雙腳穿上平穩的球鞋，準備好邁向戶外的大地。',
    icon: '👟',
    badgeText: '足部整裝啟程',
    difficultyLevel: '生活自立',
    requiredAbilities: {
      posturalMotor: [
        '坐姿低頭彎腰向前觸及足部，軀幹具備良好屈曲與回正力量',
        '足踝關節被動活動度正常（背屈達 90 度，不強烈垂足尖足）'
      ],
      handFunction: [
        '雙手（或健側單手搭配輔具）能撐開彈性緊繃之襪口',
        '單手能撕開、對齊並壓緊球鞋魔鬼氈束帶'
      ],
      cognitiveSensory: [
        '足底感覺回饋，能感覺腳跟是否完整嵌入鞋後跟中',
        '空間辨識鞋子左右腳之方向'
      ]
    },
    adaptiveStrategies: [
      '使用穿襪輔具器（Sock Aid），將襪子套在塑膠片上拉繩套入腳掌',
      '使用長柄不鏽鋼鞋拔（Long-handled Shoehorn），坐著免彎腰穿鞋',
      '鞋帶改用彈性免綁旋鈕鞋帶或大片寬版魔鬼氈包覆款式'
    ],
    relatedTaskIds: [31, 36, 37],
    milestoneTaskId: 36
  },
  {
    id: 'wish-cloth-05',
    actionVerb: '梳洗',
    actionVerbFull: '梳理頭髮對鏡刷牙整理儀容',
    animationType: 'grooming',
    category: '衣',
    title: '對著鏡子打理儀容刮鬍梳頭',
    subtitle: '看著鏡中清爽乾淨的自己，梳理整齊、刮去鬍渣，散發容光煥發的精神與朝氣。',
    icon: '🪞',
    badgeText: '自信容光煥發',
    difficultyLevel: '入門基礎',
    requiredAbilities: {
      posturalMotor: [
        '在洗手台或梳妝台前維持獨立站姿或高背坐姿 10 分鐘',
        '頭頸能自由轉向左側與右側以照鏡檢視全貌'
      ],
      handFunction: [
        '健側手臂能高舉過肩，手肘屈曲觸及頭頂與後腦勺',
        '單手平穩握持電動刮鬍刀或梳子進行精確貼臉游移'
      ],
      cognitiveSensory: [
        '面部感覺知覺對稱，能察覺鬍渣殘留或髮流平整度',
        '鏡像空間認知清晰，動作方向不混淆'
      ]
    },
    adaptiveStrategies: [
      '使用可水洗三刀頭充電式旋轉電動刮鬍刀，安全防刮傷',
      '手柄包覆泡棉管加粗手感，減輕手指握持疲倦感',
      '在梳妝台前安裝放大雙面旋轉壁鏡，輕鬆看清患側臉頰'
    ],
    relatedTaskIds: [40, 60, 65],
    milestoneTaskId: 40
  },

  // ==========================================
  // 【住】安全無礙領域（5 張願望圖卡）
  // ==========================================
  {
    id: 'wish-home-01',
    actionVerb: '翻身',
    actionVerbFull: '曲膝擺臂側身推床自立坐起',
    animationType: 'bed-rollover',
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=700&auto=format&fit=crop&q=80',
    imageAlt: '早晨在溫暖臥室平穩從床上坐起情境',
    category: '住',
    title: '夜間自己安全翻身與起床坐好',
    subtitle: '半夜醒來不再被困在床上動彈不得，能自由側身調整睡姿、穩固坐至床邊。',
    icon: '🛏️',
    badgeText: '床邊核心自由',
    difficultyLevel: '入門基礎',
    requiredAbilities: {
      posturalMotor: [
        '核心肌群控制：能進行骨盆抬臀（橋式運動 Bridging）在床上微調位置',
        '健側手能抱住患側肢體帶動身體朝患側或健側側臥',
        '側臥後能順利將雙腳垂放床緣，並用健側手肘單臂撐起軀幹坐直'
      ],
      handFunction: [
        '健側上肢具備良好的推地伸展支撐力道（Triceps push-off）',
        '手掌能抓握床欄或床緣提供引導與支撐'
      ],
      cognitiveSensory: [
        '早晚清醒時方向感清楚，坐起後無嚴重姿態性低血壓頭暈',
        '能感知床緣邊界距離，避免滑落床下'
      ]
    },
    adaptiveStrategies: [
      '床側加裝穩固之床邊輔助扶手（Bed Rail Handle），提供安全抓拉支點',
      '使用減壓透氣防滑床單，降低翻身時背部摩擦阻力',
      '床邊放置感應式柔和夜燈，腳一著地自動亮起照明'
    ],
    relatedTaskIds: [51, 52, 53, 54],
    milestoneTaskId: 53
  },
  {
    id: 'wish-home-02',
    actionVerb: '移位',
    actionVerbFull: '重心前移挺立由輪椅移至沙發',
    animationType: 'transfer-sofa',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700&auto=format&fit=crop&q=80',
    imageAlt: '安全移位至客廳柔軟沙發放鬆情境',
    category: '住',
    title: '獨立移位至輪椅與客廳沙發',
    subtitle: '客廳就是生活重心！自由穿梭在臥房、輪椅與沙發之間，舒適地看電視與家人相聚。',
    icon: '🛋️',
    badgeText: '居家移位特工',
    difficultyLevel: '生活自立',
    requiredAbilities: {
      posturalMotor: [
        '床邊坐姿動態平衡良好，軀幹能主動向前傾（Nose over toes）',
        '下肢具備足夠伸肌力量支撐身體抬臀站起（Pivot transfer）',
        '以健側腳為樞紐轉動身體 90 度，臀部平穩著陸於目標椅面'
      ],
      handFunction: [
        '健側手能牢牢按壓輪椅煞車柄鎖定車輪，收折腳踏板',
        '雙手能推撐椅把或床沿提供向上推進力'
      ],
      cognitiveSensory: [
        '安全性檢查順序記憶（移位前必鎖煞車、收踏板、鞋底防滑）',
        '能預估兩側高低落差，不盲目冒進'
      ]
    },
    adaptiveStrategies: [
      '在床與輪椅之間搭建滑位板（Transfer Board），坐著平移免站立',
      '客廳沙發加放硬質高密度坐墊，提升椅面高度避免下陷難起身',
      '輪椅把手加裝延長煞車桿，患側側亦可單手跨身操作'
    ],
    relatedTaskIds: [55, 56, 57],
    milestoneTaskId: 55
  },
  {
    id: 'wish-home-03',
    actionVerb: '如廁',
    actionVerbFull: '抓握扶手平穩蹲坐安全如廁',
    animationType: 'toilet',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=700&auto=format&fit=crop&q=80',
    imageAlt: '自立如廁保有隱私與尊嚴情境',
    category: '住',
    title: '自己上洗手間如廁關門自理',
    subtitle: '維護個人至高隱私，進出廁所、轉位馬桶、穿脫褲子與清潔，一切自己掌握。',
    icon: '🚽',
    badgeText: '尊嚴如廁無憂',
    difficultyLevel: '生活自立',
    requiredAbilities: {
      posturalMotor: [
        '能在狹小廁所空間內轉位，並於馬桶上維持端坐平穩',
        '如廁後能靠健側單腳與單手扶手站立支撐 10~20 秒供穿褲與擦拭',
        '能向前彎腰伸手沖水不跌倒'
      ],
      handFunction: [
        '健側手能反手觸及臀後進行衛生紙清潔擦拭',
        '單手穿脫鬆緊內褲及按壓沖水閥'
      ],
      cognitiveSensory: [
        '能察覺便意尿意並即時反應，非失禁或過度延遲',
        '衛浴狹窄潮濕環境下之防滑高度警覺'
      ]
    },
    adaptiveStrategies: [
      '馬桶旁加裝 L 型或翻轉式安全扶手，提供坐下站起強大拉力',
      '安裝免治馬桶溫水便座，單鍵自動清洗烘乾，省去反手擦拭困擾',
      '加裝馬桶增高墊（Raised Toilet Seat），降低起坐膝蓋負擔'
    ],
    relatedTaskIds: [58, 59, 60],
    milestoneTaskId: 58
  },
  {
    id: 'wish-home-04',
    actionVerb: '沐浴',
    actionVerbFull: '坐洗澡椅擦拭全身享受熱水',
    animationType: 'shower',
    imageUrl: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=700&auto=format&fit=crop&q=80',
    imageAlt: '在安全淋浴椅上享受清爽熱水澡情境',
    category: '住',
    title: '坐在沐浴椅上舒舒服服洗熱水澡',
    subtitle: '享受溫暖熱水洗滌身心疲憊，自己搓洗身體與洗頭，不再感覺黏膩沉重。',
    icon: '🚿',
    badgeText: '個人清潔自理',
    difficultyLevel: '生活自立',
    requiredAbilities: {
      posturalMotor: [
        '安全跨越浴室門檻或止水墩，或在沐浴旋轉椅上平穩轉入',
        '濕滑環境下之雙足防滑本體感知'
      ],
      handFunction: [
        '健側手能握持蓮蓬頭及調節冷熱水水龍頭',
        '使用沐浴巾或長柄沐浴刷擦洗患側背部、腋下與下肢'
      ],
      cognitiveSensory: [
        '溫度知覺正常，避免患側感覺遲鈍導致燙傷意外',
        '空間意識清晰，能完整洗淨未忽略之患側半身'
      ]
    },
    adaptiveStrategies: [
      '使用靠背防滑加寬沐浴椅（Shower Chair）配合吸盤腳墊',
      '使用長柄洗澡海綿刷及套手式沐浴手套，單手擠壓即可起泡',
      '地面全鋪設高摩擦係數防滑地墊，門口配置超細纖維吸水踏墊'
    ],
    relatedTaskIds: [59, 61, 65],
    milestoneTaskId: 61
  },
  {
    id: 'wish-home-05',
    actionVerb: '鎖扣',
    actionVerbFull: '伸手撥動窗栓穩固門窗把手',
    animationType: 'lock-windows',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=700&auto=format&fit=crop&q=80',
    imageAlt: '巡視溫馨居家門窗開關安心入眠情境',
    category: '住',
    title: '巡視全家門窗家電與安心入眠',
    subtitle: '睡前走巡客廳與廚房，關閉電燈、鎖好大門，守護家庭安全的自信一家之主。',
    icon: '🏡',
    badgeText: '全屋居家掌控',
    difficultyLevel: '活躍回歸',
    requiredAbilities: {
      posturalMotor: [
        '能在室內無輔具或單拐輔助下，巡走客廳、玄關與各房間',
        '能伸手向上關閉氣窗或向下插拔低處電器插頭'
      ],
      handFunction: [
        '手指能順暢撥動按鈕開關、轉動門鎖水平把手與鑰匙旋鈕'
      ],
      cognitiveSensory: [
        '程序記憶與檢查清單認知（瓦斯門窗電源鎖閉檢核）',
        '夜間微弱光線下的視覺環境適應力'
      ]
    },
    adaptiveStrategies: [
      '將傳統圓形喇叭鎖改換為水平式把手門鎖（Lever Handle）',
      '導入語音智慧家電或遙控開關，聲控即可關閉全室照明',
      '關鍵動線保持零雜物堆放，確保無障礙淨空通道'
    ],
    relatedTaskIds: [72, 75],
    milestoneTaskId: 75
  },

  // ==========================================
  // 【行】自由漫步領域（5 張願望圖卡）
  // ==========================================
  {
    id: 'wish-move-01',
    actionVerb: '推移',
    actionVerbFull: '健側手腳協調推進輪椅轉向',
    animationType: 'wheelchair',
    category: '行',
    title: '單手單腳熟練操控輪椅室內巡航',
    subtitle: '即使暫時還不能走遠，也能靠自己的力量滑動輪椅自由到達家裡每一個角落。',
    icon: '🦽',
    badgeText: '初期機動自由',
    difficultyLevel: '入門基礎',
    requiredAbilities: {
      posturalMotor: [
        '長時間輪椅坐姿對稱平衡，無明顯偏癱側骨盆下垂或側彎',
        '健側大腿具備足夠屈曲與伸展力，能以健腳單足點地扒地前進與倒退'
      ],
      handFunction: [
        '健側上肢能規律推動輪椅大輪外圈手推環（Handrim）',
        '手腳協調配合完成 90 度與 180 度精準迴轉'
      ],
      cognitiveSensory: [
        '對患側輪椅輪距與門框寬度有良好空間概念，不撞擊門緣',
        '轉向時能兼顧前後障礙物視野'
      ]
    },
    adaptiveStrategies: [
      '將輪椅座高微調降至雙腳可平貼地面之高度（Hemi-height wheelchair）',
      '卸除健側腳踏板，讓健腳自由施力扒地前進',
      '患側扶手加裝下垂固定支撐臂墊（Arm trough），保護偏癱側肩膀防脫臼'
    ],
    relatedTaskIds: [76, 79, 81],
    milestoneTaskId: 76
  },
  {
    id: 'wish-move-02',
    actionVerb: '邁步',
    actionVerbFull: '單手持手杖循序邁出穩健步伐',
    animationType: 'walking-cane',
    category: '行',
    title: '拿著單拐在室內客廳平穩步行',
    subtitle: '雙腳重新踩在堅實地面，在客廳自在穿梭倒水拿東西，不再被輪椅拘束。',
    icon: '🦯',
    badgeText: '重獲雙腳自由',
    difficultyLevel: '生活自立',
    requiredAbilities: {
      posturalMotor: [
        '患側下肢具備 75%~100% 體重負重能力（Brunnstrom Stage IV 以上）',
        '骨盆與髖部外展肌群有力（Trendelenburg sign 陰性或輕微）',
        '步態節奏穩定（拐杖先出、患腳跟進、健腳跨越）'
      ],
      handFunction: [
        '健側手掌能穩固下壓握持四腳拐（Quad cane）或單點拐',
        '下壓拐杖時肩頸與手肘能抵抗下沉反作用力'
      ],
      cognitiveSensory: [
        '本體感覺良好，患腳踩地能明確感知地面回饋',
        '動態行走中能轉頭張望而步態不紊亂'
      ]
    },
    adaptiveStrategies: [
      '初期使用寬底四腳拐提供大面積防護，待平衡提升後改用單點拐',
      '患側若有垂足問題，務必穿戴輕量足踝裝具（AFO），確保腳跟先著地不拖曳',
      '客廳鋪設防滑耐磨木地板，移除小地毯與散落電線'
    ],
    relatedTaskIds: [78, 80, 81, 83],
    milestoneTaskId: 80
  },
  {
    id: 'wish-move-03',
    actionVerb: '漫步',
    actionVerbFull: '控制軀幹重心平穩漫步公園步道',
    animationType: 'slope-walk',
    category: '行',
    title: '安全跨越門檻與走上戶外斜坡',
    subtitle: '不再害怕地面的高低落差，穩健跨過大門門檻、漫步社區斜坡無所阻礙。',
    icon: '⛰️',
    badgeText: '立體地形征服',
    difficultyLevel: '生活自立',
    requiredAbilities: {
      posturalMotor: [
        '健側單腳獨立支撐站立至少 3~5 秒，供患腳主動跨越門檻',
        '斜坡行走時能主動調節重心（上坡軀幹前傾、下坡步幅縮小微屈膝）',
        '足踝關節背屈與蹠屈能靈活適應傾斜坡度'
      ],
      handFunction: [
        '拐杖落點精準，落於斜坡穩固點不滑移'
      ],
      cognitiveSensory: [
        '深淺視覺（Depth perception）敏銳，能準確判斷門檻高度與斜度',
        '感知地面潮濕、積水或青苔之防滑預判'
      ]
    },
    adaptiveStrategies: [
      '跨越門檻口訣：「好腳先過、壞腳再過；拐杖立穩在中間」',
      '大門門檻加裝橡膠斜坡板（Threshold Ramp），撫平高低差',
      '拐杖底端換裝四爪可旋轉抓地橡膠防滑大底'
    ],
    relatedTaskIds: [82, 85, 87],
    milestoneTaskId: 87
  },
  {
    id: 'wish-move-04',
    actionVerb: '跨登',
    actionVerbFull: '扶手支撐好腿先上健步登階',
    animationType: 'stairs',
    category: '行',
    title: '輕鬆上下 3~5 階樓梯返家',
    subtitle: '戰勝公寓台階與騎樓落差，循著扶手穩健登階，堂堂正正回到溫暖的家。',
    icon: '🪜',
    badgeText: '階梯障礙突破',
    difficultyLevel: '生活自立',
    requiredAbilities: {
      posturalMotor: [
        '強大之單側股四頭肌收縮力（好腿上階梯時需支撐全身重量登高）',
        '患側下肢在下階梯時具備良好的離心收縮（Eccentric control）不突然軟腳',
        '遵循階梯登降黃金口訣：「好腿上天堂、壞腿下地獄」'
      ],
      handFunction: [
        '健側手能牢固握緊樓梯固定扶手，同時單手兼顧拐杖提攜'
      ],
      cognitiveSensory: [
        '高處視差適應，登高不心慌目眩',
        '精確目測每一踏階深度與階高'
      ]
    },
    adaptiveStrategies: [
      '「上樓：健腳先上、患腳跟上、拐杖最後；下樓：拐杖先下、患腳先下、健腳最後」',
      '樓梯每一踏階黏貼醒目之高對比黃黑防滑膠條',
      '雙手扶手設置，讓上樓與下樓時健側均能握住外側扶手'
    ],
    relatedTaskIds: [90, 92],
    milestoneTaskId: 90
  },
  {
    id: 'wish-move-05',
    actionVerb: '採買',
    actionVerbFull: '持手杖漫步超商親自挑選商品',
    animationType: 'store-walk',
    category: '行',
    title: '獨自走到巷口便利商店買報紙',
    subtitle: '穿越斑馬線、走在微風輕拂的人行道上，跟超商店員互道早安，世界再次為你敞開。',
    icon: '🏪',
    badgeText: '社區完全重返',
    difficultyLevel: '活躍回歸',
    requiredAbilities: {
      posturalMotor: [
        '戶外連續步行耐力達 200~300 公尺不需坐下休息',
        '步速達到每秒 0.8 公尺以上，能在綠燈時限內安全通過標準十字路口'
      ],
      handFunction: [
        '單手持拐，另一手能攜帶輕便小背包或購物手提袋'
      ],
      cognitiveSensory: [
        '雙重任務處理能力（Dual-tasking）：一邊走路一邊注意紅綠燈號誌與來車',
        '方向感與社區空間地圖記憶正常'
      ]
    },
    adaptiveStrategies: [
      '穿戴高辨識度反光反差背心或隨身哨，增加用路安全',
      '使用具備附輪煞車與置物籃之戶外型健步助行車（Rollator）',
      '口袋備妥悠遊卡或零錢夾，便於超商迅速感應結帳'
    ],
    relatedTaskIds: [92, 95, 98, 100],
    milestoneTaskId: 100
  },

  // ==========================================
  // 【育】知性探索領域（4 張願望圖卡）
  // ==========================================
  {
    id: 'wish-learn-01',
    actionVerb: '撥通',
    actionVerbFull: '點擊螢幕接聽視訊與家人暢談',
    animationType: 'video-call',
    category: '育',
    title: '用手機跟兒孫 Line 視訊看相片',
    subtitle: '科技拉近思念的距離！單手滑動手機、點開視訊鏡頭，看著寶貝孫子的笑臉聊聊天。',
    icon: '📱',
    badgeText: '數位親情連線',
    difficultyLevel: '入門基礎',
    requiredAbilities: {
      posturalMotor: [
        '坐姿或臥姿下將手機放置於桌上支架，頸部角度舒適'
      ],
      handFunction: [
        '健側食指單指能精準點擊螢幕圖示與滑動翻頁',
        '手部能持續點按螢幕不因震顫產生誤觸'
      ],
      cognitiveSensory: [
        '視力空間辨識良好，能認得 Line App 綠色圖示與家人頭像',
        '語言或語意理解力，能進行視訊簡單應答溝通'
      ]
    },
    adaptiveStrategies: [
      '在桌面安裝可 360 度旋轉之金屬加重平板手機懶人支架',
      '手機字體與圖示放大至最大規格，開啟「簡易長輩桌面模式」',
      '善用 Line 內建語音輸入轉文字功能，免去注音打字煩惱'
    ],
    relatedTaskIds: [101, 102, 125],
    milestoneTaskId: 102
  },
  {
    id: 'wish-learn-02',
    actionVerb: '分裝',
    actionVerbFull: '依時按格取出藥錠定時服藥',
    animationType: 'meds-clock',
    category: '育',
    title: '自己看時鐘按時服藥與分裝藥盒',
    subtitle: '自己的健康自己作主，每天準時拿出七彩藥盒，倒水吃藥井井有條。',
    icon: '💊',
    badgeText: '健康自主管理',
    difficultyLevel: '生活自立',
    requiredAbilities: {
      posturalMotor: [
        '坐姿平穩於桌面，雙手肘能自然靠於桌緣作為支點'
      ],
      handFunction: [
        '健側大拇指與食指能進行小顆粒微細捏取（Tip-to-tip pinch）',
        '單手能扳開藥盒透明扣蓋，並將膠囊從鋁箔泡殼推擠入掌心'
      ],
      cognitiveSensory: [
        '時間定向感正常（清楚當前是早晨、中午或睡前）',
        '藥品外觀辨識力，明確知曉各種慢性病藥物用途',
        '配水吞服小藥丸時無嗆咳障礙'
      ]
    },
    adaptiveStrategies: [
      '使用大字體高對比一週七日（早中晚）獨立彈跳開蓋藥盒',
      '使用撥藥輔助器（Pill Popper），輕輕一夾藥丸自動落入盒中',
      '智慧手機設定服藥鬧鐘，鈴響時螢幕同步顯示該次服藥照片'
    ],
    relatedTaskIds: [105, 108],
    milestoneTaskId: 105
  },
  {
    id: 'wish-learn-03',
    actionVerb: '書寫',
    actionVerbFull: '提筆流暢簽署姓名寫下心得',
    animationType: 'handwriting',
    category: '育',
    title: '拿筆簽名與寫下自己與家人的名字',
    subtitle: '一筆一畫寫下自己的姓名，在簽單與文件上落款，重新感受筆墨流轉的尊嚴與力量。',
    icon: '✍️',
    badgeText: '文字手感回歸',
    difficultyLevel: '生活自立',
    requiredAbilities: {
      posturalMotor: [
        '書寫坐姿軀幹對稱挺直，不依賴過度聳肩代償'
      ],
      handFunction: [
        '若為健側利手書寫：單手書寫時，患側手臂能作為紙張壓鎮手',
        '若為患側手書寫訓練：需具備指尖單獨活動與三指握筆耐力（Brunnstrom Stage V 以上）',
        '筆觸施力均勻，手腕貼於桌面小幅度擺動'
      ],
      cognitiveSensory: [
        '字形空間架構記憶（失寫症 Dysgraphia 改善或無失寫）',
        '眼手視覺引導追蹤筆尖軌跡流暢'
      ]
    },
    adaptiveStrategies: [
      '原子筆外層套裝三角泡棉握筆器（Pencil Grip），增加握感面積',
      '使用壓克力或磁吸式寫字板夾固定紙張，單手寫字紙張不滑動',
      '優先練習大字體粗筆（如粗字白板筆），再逐步過渡至一般原子筆'
    ],
    relatedTaskIds: [110, 112],
    milestoneTaskId: 112
  },
  {
    id: 'wish-learn-04',
    actionVerb: '點數',
    actionVerbFull: '掏出皮夾點數鈔票零錢順利付款',
    animationType: 'cash-pay',
    category: '育',
    title: '自己拿皮夾付錢、算錢與找零',
    subtitle: '買東西不再手忙腳亂，自己抽出千元鈔票、數清銅板，精準完成生活交易。',
    icon: '👛',
    badgeText: '金融生活掌控',
    difficultyLevel: '生活自立',
    requiredAbilities: {
      posturalMotor: [
        '站立或坐姿於櫃台前，雙臂置於胸前平穩操作'
      ],
      handFunction: [
        '健側手指靈巧翻開長夾，兩指伸入夾層捏出紙鈔',
        '單手辨識不同大小硬幣（50元、10元、5元、1元）並撥出'
      ],
      cognitiveSensory: [
        '基礎數學計算與找零概念（100 減 35 等於 65）',
        '抗外界干擾注意力（不因後方排隊人群催促而焦慮手抖）'
      ]
    },
    adaptiveStrategies: [
      '使用大開口風琴式分類零錢包，每種硬幣一目了然',
      '優先綁定電子票證（如悠遊聯名卡自動加值），單手靠卡即扣款',
      '出門前預先將常用鈔票與零錢分開存放，方便迅速取用'
    ],
    relatedTaskIds: [115, 120],
    milestoneTaskId: 115
  },

  // ==========================================
  // 【樂】重拾歡笑領域（4 張願望圖卡）
  // ==========================================
  {
    id: 'wish-joy-01',
    actionVerb: '澆灌',
    actionVerbFull: '持壺傾注清水潤澤陽台綠植',
    animationType: 'watering-plants',
    imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=700&auto=format&fit=crop&q=80',
    imageAlt: '在生機盎然的陽台為綠意盆栽修剪澆水情境',
    category: '樂',
    title: '在陽台細心修剪盆栽為花草澆水',
    subtitle: '看著綠意盎然的綠葉綻放，親手澆灌生活的新希望，沉浸在植物療癒的平靜時光中。',
    icon: '🪴',
    badgeText: '綠手指園藝時光',
    difficultyLevel: '入門基礎',
    requiredAbilities: {
      posturalMotor: [
        '陽台空間狹小下維持安全站立或坐於高腳花凳',
        '向前伸手彎腰觸及花台時之動態核心軀幹控制'
      ],
      handFunction: [
        '健側手單手按壓噴霧式澆水壺握把（重複指力握壓）',
        '單手操作園藝修枝平頭安全剪刀'
      ],
      cognitiveSensory: [
        '辨別植物枯葉與健康綠芽之視覺敏銳度',
        '陽台低矮女兒牆之高度防墜墜落安全認知'
      ]
    },
    adaptiveStrategies: [
      '將地面盆栽架高至桌面或立體花架（腰部高度），免去蹲下彎腰危險',
      '使用輕量型長嘴澆水壺（僅裝 500ml）或伸縮式園藝水管',
      '使用自動回彈省力修枝剪，手掌放鬆即自動張開'
    ],
    relatedTaskIds: [126, 148],
    milestoneTaskId: 126
  },
  {
    id: 'wish-joy-02',
    actionVerb: '落子',
    actionVerbFull: '雙指捏起棋子專注落下棋盤',
    animationType: 'play-chess',
    imageUrl: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=700&auto=format&fit=crop&q=80',
    imageAlt: '與老友坐在樹下喝茶沉浸於一盤好棋情境',
    category: '樂',
    title: '跟老朋友在樹下泡茶下盤好棋',
    subtitle: '手拈棋子落子有聲，茶香嫋嫋中重溫老友笑語，找回棋盤上的運籌帷幄與睿智。',
    icon: '♟️',
    badgeText: '益智休閒回歸',
    difficultyLevel: '生活自立',
    requiredAbilities: {
      posturalMotor: [
        '在戶外公園石凳或木椅上端坐 1 小時以上，軀幹挺立不前傾側倒'
      ],
      handFunction: [
        '大拇指與食指能精準捏取直徑 3 公分的木質棋子',
        '能穩定越過棋盤其他棋子，將棋子放置於準確交叉格線位置'
      ],
      cognitiveSensory: [
        '執行功能（Executive function）：棋局邏輯推理、策略規劃與應變',
        '良好之社交人際互動意願與勝負心理調適'
      ]
    },
    adaptiveStrategies: [
      '使用加厚大尺寸磁吸式象棋盤，棋子不易因手部微震而移位傾倒',
      '準備背靠式充氣減壓坐墊，攜帶至公園石凳使用保護腰椎',
      '健側拿茶杯品茗，享受從容不迫的生活雅趣'
    ],
    relatedTaskIds: [128, 132],
    milestoneTaskId: 128
  },
  {
    id: 'wish-joy-03',
    actionVerb: '高歌',
    actionVerbFull: '手握麥克風歡唱愛歌放鬆身心',
    animationType: 'singing',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=700&auto=format&fit=crop&q=80',
    imageAlt: '握住麥克風熱情唱出回憶金曲情境',
    category: '樂',
    title: '拿起麥克風唱一首拿手老歌',
    subtitle: '大聲唱出心中的熱情！鍛鍊肺活量與咬字發音，在旋律中找回自信開朗的笑容。',
    icon: '🎤',
    badgeText: '歡唱心靈療癒',
    difficultyLevel: '生活自立',
    requiredAbilities: {
      posturalMotor: [
        '站立或坐姿下橫膈膜深呼吸支撐（Diaphragmatic breath support）'
      ],
      handFunction: [
        '單手能持續持握重約 300 公克的麥克風靠近下巴'
      ],
      cognitiveSensory: [
        '言語動作企劃（Apraxia of speech 改善），能配合節奏發音咬字',
        '肺活量與發音氣流控制良好，換氣順暢不憋氣頭暈',
        '能看懂字幕伴唱節奏提示'
      ]
    },
    adaptiveStrategies: [
      '使用落地式直立麥克風架，雙手完全放鬆免持，專注於呼吸唱歌',
      '挑選節奏緩慢、歌詞熟悉的經典抒情懷念老歌',
      '唱歌也是極佳的構音發音吞嚥復健（Melodic Intonation Therapy）'
    ],
    relatedTaskIds: [130, 145],
    milestoneTaskId: 130
  },
  {
    id: 'wish-joy-04',
    actionVerb: '乘車',
    actionVerbFull: '轉身平穩坐入車內出發郊外踏青',
    animationType: 'travel-car',
    imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=700&auto=format&fit=crop&q=80',
    imageAlt: '三代同堂一同出遊踏青合拍全家福情境',
    category: '樂',
    title: '與全家人一起開車出遊拍全家福',
    subtitle: '走出復健病房的藩籬，奔向大自然的懷抱！與深愛的家人共度假期，留下最珍貴的合影。',
    icon: '📸',
    badgeText: '圓夢天倫大合影',
    difficultyLevel: '活躍回歸',
    requiredAbilities: {
      posturalMotor: [
        '具備上下小客車之轉位協調力（臀部先坐入座椅、再旋轉雙腳收進車內）',
        '耐受車程 1~2 小時坐姿震動不暈車疲勞',
        '能在草地、平緩碎石步道或景點步道持拐或推助行車行走'
      ],
      handFunction: [
        '能在全家福鏡頭前比出勝利「V」手勢或與家人溫馨牽手'
      ],
      cognitiveSensory: [
        '對長途旅行環境改變之適應力良好，作息規律',
        '享受家人陪伴的天倫樂趣，重拾對未來的無限期待'
      ]
    },
    adaptiveStrategies: [
      '汽車副駕駛座放置旋轉坐墊（Swivel Seat Cushion），輕鬆轉身出入車廂',
      '後車廂常備輕量折疊輪椅，長距離風景區可適時換乘保存體力',
      '安排無障礙友善觀光步道與寬敞無障礙洗手間之景點'
    ],
    relatedTaskIds: [95, 140, 150],
    milestoneTaskId: 150
  }
];

// Helper functions
export const getWishCardsByCategory = (category: WishCard['category']) => {
  return WISH_CARDS.filter(card => card.category === category);
};

export const getWishCardById = (id: string) => {
  return WISH_CARDS.find(card => card.id === id);
};
