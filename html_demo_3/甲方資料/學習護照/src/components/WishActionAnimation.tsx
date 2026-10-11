import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, Sparkles } from 'lucide-react';

interface WishActionAnimationProps {
  animationType: string;
  actionVerb?: string;
  actionVerbFull?: string;
  category: string;
  className?: string;
  compact?: boolean;
  videoUrl?: string;
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
      } else if (url.includes('watch?v=')) {
        videoId = url.split('watch?v=')[1]?.split('&')[0] || '';
      } else if (url.includes('embed/')) {
        videoId = url.split('embed/')[1]?.split('?')[0] || '';
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=1&playsinline=1`;
      }
    }
  } catch {}
  return null;
}

export const WishActionAnimation: React.FC<WishActionAnimationProps> = ({
  animationType,
  actionVerb = '動作',
  actionVerbFull = '',
  category,
  className = '',
  compact = false,
  videoUrl,
}) => {
  const [interactiveCount, setInteractiveCount] = useState(0);
  const [showVideo, setShowVideo] = useState(true);

  const youtubeEmbed = videoUrl ? getYouTubeEmbedUrl(videoUrl) : null;

  // Category-specific pastel gradients
  const getBgGradient = () => {
    switch (category) {
      case '食':
        return 'from-amber-100/80 via-orange-50/70 to-amber-50';
      case '衣':
        return 'from-sky-100/80 via-indigo-50/70 to-blue-50';
      case '住':
        return 'from-emerald-100/80 via-teal-50/70 to-emerald-50';
      case '行':
        return 'from-blue-100/80 via-cyan-50/70 to-slate-50';
      case '育':
        return 'from-purple-100/80 via-violet-50/70 to-purple-50';
      case '樂':
        return 'from-rose-100/80 via-pink-50/70 to-rose-50';
      default:
        return 'from-stone-100 via-stone-50 to-stone-100';
    }
  };

  const getVerbBadgeColor = () => {
    switch (category) {
      case '食':
        return 'bg-amber-600 text-white';
      case '衣':
        return 'bg-sky-600 text-white';
      case '住':
        return 'bg-emerald-600 text-white';
      case '行':
        return 'bg-blue-600 text-white';
      case '育':
        return 'bg-purple-600 text-white';
      case '樂':
        return 'bg-rose-600 text-white';
      default:
        return 'bg-stone-800 text-white';
    }
  };

  const renderScene = () => {
    switch (animationType) {
      // 1. 【舀起】拿湯匙喝熱湯麵
      case 'scoop-soup':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Steam rising */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute w-2.5 h-7 bg-white/70 rounded-full blur-[1px]"
                style={{ left: `${42 + i * 8}%`, bottom: '46%' }}
                animate={{
                  y: [-4, -30],
                  opacity: [0, 0.9, 0],
                  scaleX: [1, 1.5],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: 'easeOut',
                }}
              />
            ))}

            {/* Bowl */}
            <div className="absolute bottom-5 w-32 h-16 bg-amber-600 rounded-b-full border-4 border-amber-800 shadow-md flex flex-col items-center justify-start overflow-hidden">
              <div className="w-full h-4 bg-amber-400/90 rounded-full mt-0.5 border-b border-amber-500/50" />
              <div className="flex gap-2 mt-1">
                <span className="text-xs">🍜</span>
                <span className="text-xs">🥬</span>
              </div>
            </div>

            {/* Spoon scooping and lifting */}
            <motion.div
              className="absolute origin-bottom-right"
              animate={{
                x: [18, -10, -14, 20, 18],
                y: [4, 14, -28, -28, 4],
                rotate: [15, 0, -22, -12, 15],
              }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="w-3.5 h-22 bg-gradient-to-t from-stone-400 to-stone-200 rounded-full shadow-xs" />
              <div className="w-9 h-7 bg-stone-300 rounded-full border border-stone-400 -mt-2 -ml-3 flex items-center justify-center">
                <motion.div
                  className="w-6 h-4 bg-amber-400 rounded-full"
                  animate={{ opacity: [0, 0.4, 1, 1, 0] }}
                  transition={{ duration: 3.2, repeat: Infinity }}
                />
              </div>
            </motion.div>
          </div>
        );

      // 2. 【夾取】用筷子夾起小菜水果
      case 'chopsticks':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Plate */}
            <div className="absolute bottom-5 w-32 h-10 bg-white rounded-full border-3 border-stone-300 shadow-md flex items-center justify-center">
              <div className="w-24 h-6 bg-stone-100 rounded-full" />
            </div>

            {/* Dumpling/Fruit piece */}
            <motion.div
              className="absolute w-8 h-8 bg-orange-500 rounded-2xl shadow-sm border border-orange-600 flex items-center justify-center text-white text-xs font-bold"
              animate={{
                y: [2, 6, -26, -26, 2],
                scale: [1, 0.95, 1.05, 1.05, 1],
              }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              🍓
            </motion.div>

            {/* Left Chopstick */}
            <motion.div
              className="absolute w-2 h-26 bg-amber-900 rounded-full shadow-sm origin-top"
              animate={{
                rotate: [-8, -3, -10, -10, -8],
                x: [-14, -7, -7, -7, -14],
                y: [-10, -2, -32, -32, -10],
              }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Right Chopstick */}
            <motion.div
              className="absolute w-2 h-26 bg-amber-900 rounded-full shadow-sm origin-top"
              animate={{
                rotate: [8, 3, 10, 10, 8],
                x: [14, 7, 7, 7, 14],
                y: [-10, -2, -32, -32, -10],
              }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        );

      // 3. 【旋開】旋轉開瓶蓋飲用
      case 'open-bottle':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Water Bottle */}
            <div className="absolute bottom-4 w-18 h-30 bg-sky-200/90 rounded-2xl border-3 border-sky-400 shadow-md flex flex-col items-center justify-between p-2 overflow-hidden">
              <div className="w-12 h-10 bg-sky-300/80 rounded-lg flex items-center justify-center text-xs font-bold text-sky-800">
                💧
              </div>
              <div className="w-10 h-10 bg-sky-400/30 rounded-full" />
            </div>

            {/* Bottle Neck */}
            <div className="absolute bottom-33 w-9 h-4 bg-sky-300 border-2 border-sky-500 rounded-xs" />

            {/* Bottle Cap rotating and lifting */}
            <motion.div
              className="absolute bottom-36 w-11 h-7 bg-blue-600 rounded-t-md border-2 border-blue-800 shadow-md flex items-center justify-center text-white"
              animate={{
                y: [0, -4, -20, -20, 0],
                rotate: [0, 45, 180, 180, 0],
                scale: [1, 1.1, 1.1, 1, 1],
              }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="w-full h-1 bg-white/40" />
            </motion.div>

            {/* Refreshing Sparkle */}
            <motion.div
              className="absolute bottom-42 text-amber-400 text-lg font-bold"
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.4, 0.8] }}
              transition={{ duration: 2.8, repeat: Infinity }}
            >
              ✨
            </motion.div>
          </div>
        );

      // 4. 【沖泡】提壺沖泡熱茶
      case 'brew-tea':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Teapot Tilting */}
            <motion.div
              className="absolute left-12 bottom-16 w-22 h-16 bg-amber-800 rounded-3xl border-2 border-amber-950 shadow-md flex items-center justify-center"
              animate={{
                rotate: [0, -28, -28, 0],
                y: [0, -6, -6, 0],
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="w-6 h-6 rounded-full bg-amber-950 -mr-18" />
              <div className="w-5 h-8 border-r-4 border-amber-950 -ml-24" />
              <span className="text-xs">🍵</span>
            </motion.div>

            {/* Flowing Tea Arc */}
            <motion.div
              className="absolute right-22 bottom-10 w-2 bg-amber-500 rounded-full"
              animate={{
                height: [0, 40, 40, 0],
                opacity: [0, 1, 1, 0],
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Teacup */}
            <div className="absolute right-16 bottom-6 w-16 h-10 bg-white rounded-b-2xl border-2 border-stone-300 shadow-sm flex items-center justify-center">
              <motion.div
                className="w-11 h-3 bg-amber-600 rounded-full mt-1"
                animate={{ scaleX: [0.4, 1, 1, 0.4] }}
                transition={{ duration: 3.5, repeat: Infinity }}
              />
            </div>
          </div>
        );

      // 5. 【圍桌】親友圍桌聚餐
      case 'dining':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Round Dining Table */}
            <div className="relative w-38 h-24 bg-amber-200 rounded-full border-4 border-amber-400 shadow-lg flex items-center justify-center">
              <div className="w-22 h-14 bg-amber-100 rounded-full border border-amber-300 flex items-center justify-center gap-2">
                <motion.span
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                  className="text-lg"
                >
                  🍲
                </motion.span>
                <span className="text-sm">🥗</span>
              </div>
            </div>

            {/* People around the table */}
            <motion.div
              className="absolute -top-1 text-2xl"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              👵
            </motion.div>
            <motion.div
              className="absolute -bottom-1 text-2xl"
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              👴
            </motion.div>
            <motion.div
              className="absolute left-6 text-2xl"
              animate={{ x: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            >
              👨
            </motion.div>
            <motion.div
              className="absolute right-6 text-2xl"
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
            >
              👧
            </motion.div>
          </div>
        );

      // 6. 【套穿】自主套穿棉質上衣
      case 'wear-shirt':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Hanger / Head */}
            <div className="absolute top-8 w-8 h-8 rounded-full bg-amber-200 border-2 border-amber-400" />

            {/* Shirt moving and putting on smoothly */}
            <motion.div
              className="relative w-32 h-26 bg-sky-400 rounded-t-3xl rounded-b-xl border-3 border-sky-600 shadow-md flex items-center justify-center"
              animate={{
                scale: [0.9, 1.05, 1, 1, 0.9],
                y: [-15, 0, 0, 0, -15],
              }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="w-12 h-6 bg-white rounded-b-full border-b-2 border-sky-600 -mt-20" />
              <div className="absolute bottom-3 text-xs font-bold text-white/90">
                舒適純棉
              </div>
            </motion.div>

            {/* Animated Sleeves swaying onto arms */}
            <motion.div
              className="absolute left-10 w-8 h-14 bg-sky-500 rounded-xl origin-top-right shadow-xs"
              animate={{ rotate: [-20, 0, 0, -20] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute right-10 w-8 h-14 bg-sky-500 rounded-xl origin-top-left shadow-xs"
              animate={{ rotate: [20, 0, 0, 20] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        );

      // 7. 【扣合】雙手對齊扣好襯衫排釦
      case 'buttoning':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Shirt Fabric Placket */}
            <div className="absolute w-24 h-38 bg-sky-100 rounded-2xl border-2 border-sky-300 shadow-inner flex items-center justify-center">
              {/* Buttonhole */}
              <div className="w-2 h-10 bg-sky-300 rounded-full border border-sky-400" />
            </div>

            {/* Button sliding smoothly into hole and fastening */}
            <motion.div
              className="absolute w-10 h-10 rounded-full bg-white border-3 border-sky-600 shadow-md flex items-center justify-center cursor-pointer"
              animate={{
                x: [-32, 0, 5, 0, -32],
                scale: [0.9, 1.1, 1, 1, 0.9],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                <div className="w-1.5 h-1.5 bg-sky-600 rounded-full" />
                <div className="w-1.5 h-1.5 bg-sky-600 rounded-full" />
                <div className="w-1.5 h-1.5 bg-sky-600 rounded-full" />
                <div className="w-1.5 h-1.5 bg-sky-600 rounded-full" />
              </div>
            </motion.div>

            {/* Success check bubble */}
            <motion.div
              className="absolute bottom-5 text-emerald-600 text-xs font-black bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full shadow-xs"
              animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.8] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              ✓ 鈕釦扣合到位
            </motion.div>
          </div>
        );

      // 8. 【穿提】坐姿套入褲管站立提拉
      case 'pants':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Pants */}
            <motion.div
              className="relative w-28 h-32 flex flex-col items-center"
              animate={{
                y: [12, -8, -8, 12],
                scaleY: [0.9, 1, 1, 0.9],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Waistband */}
              <div className="w-26 h-8 bg-blue-800 rounded-t-xl border-2 border-blue-950 flex items-center justify-center text-white text-xs font-bold">
                彈性褲頭
              </div>
              {/* Two legs */}
              <div className="w-full flex justify-between px-1">
                <div className="w-11 h-24 bg-blue-700 rounded-b-xl border-2 border-blue-900" />
                <div className="w-11 h-24 bg-blue-700 rounded-b-xl border-2 border-blue-900" />
              </div>
            </motion.div>

            {/* Upward Pull Arrow */}
            <motion.div
              className="absolute text-xl text-blue-600 font-black"
              style={{ right: '20%' }}
              animate={{ y: [10, -20], opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ⬆️
            </motion.div>
          </div>
        );

      // 9. 【踩套】踩入球鞋並拉緊魔鬼氈
      case 'shoes':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Sneaker */}
            <div className="relative w-36 h-20 bg-white rounded-2xl border-3 border-stone-400 shadow-md overflow-hidden flex items-end p-2">
              <div className="w-full h-4 bg-stone-300 rounded-sm" />
              <div className="absolute top-2 left-4 w-14 h-7 bg-rose-500 rounded-tr-2xl" />
            </div>

            {/* Foot stepping into shoe */}
            <motion.div
              className="absolute w-9 h-18 bg-amber-200 rounded-full border-2 border-amber-400"
              animate={{
                y: [-24, -4, -4, -24],
                rotate: [-15, 0, 0, -15],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Velcro strap closing */}
            <motion.div
              className="absolute w-14 h-5 bg-rose-600 rounded-full border border-rose-800"
              style={{ bottom: '38%', right: '32%' }}
              animate={{
                rotate: [38, 0, 0, 38],
                scaleX: [0.8, 1, 1, 0.8],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        );

      // 10. 【梳理】在鏡前梳整儀容
      case 'grooming':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Mirror Frame */}
            <div className="relative w-26 h-34 bg-stone-100 rounded-3xl border-4 border-amber-700 shadow-md flex items-center justify-center overflow-hidden">
              <div className="w-20 h-28 bg-sky-50 rounded-2xl flex flex-col items-center justify-center">
                <div className="w-10 h-10 bg-amber-200 rounded-full border border-amber-400 relative">
                  <div className="absolute -top-1 left-0 right-0 h-4 bg-stone-700 rounded-t-full" />
                </div>
                <div className="text-[10px] text-stone-500 font-bold mt-1">微笑鏡照</div>
              </div>
            </div>

            {/* Moving Comb */}
            <motion.div
              className="absolute text-2xl"
              animate={{
                x: [-15, 15, -15],
                y: [-25, -18, -25],
                rotate: [-10, 10, -10],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              🪮
            </motion.div>
          </div>
        );

      // 11. 【翻坐】側躺翻身坐起離床
      case 'bed-rollover':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Bed Frame */}
            <div className="absolute bottom-5 w-40 h-12 bg-indigo-900 rounded-xl border-2 border-indigo-950 shadow-md flex items-center justify-center">
              <div className="w-36 h-6 bg-indigo-200 rounded-md" />
            </div>

            {/* Pillow */}
            <div className="absolute bottom-17 left-10 w-12 h-6 bg-white rounded-lg border border-stone-300 shadow-xs" />

            {/* Figure rotating from lying flat to 90 degrees sitting */}
            <motion.div
              className="absolute origin-bottom-right flex flex-col items-center"
              style={{ bottom: '26px', right: '36%' }}
              animate={{
                rotate: [-80, -45, 0, 0, -80],
                x: [-12, -4, 0, 0, -12],
              }}
              transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="w-7 h-7 bg-amber-200 rounded-full border-2 border-amber-400 mb-1" />
              <div className="w-9 h-16 bg-emerald-500 rounded-t-xl border-2 border-emerald-700 shadow-xs" />
            </motion.div>

            {/* Trunk stability aura */}
            <motion.div
              className="absolute top-5 right-8 text-xs font-black bg-white/90 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full shadow-xs"
              animate={{ scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              💪 側躺撐起坐直
            </motion.div>
          </div>
        );

      // 12. 【移位】站立旋轉移至沙發
      case 'transfer-sofa':
        return (
          <div className="relative w-full h-full flex items-center justify-between px-10">
            {/* Wheelchair Left */}
            <div className="flex flex-col items-center">
              <span className="text-3xl">🦽</span>
              <span className="text-[10px] font-bold text-stone-600">出發點</span>
            </div>

            {/* Weight shift curved arrow */}
            <motion.div
              className="flex flex-col items-center justify-center"
              animate={{ scale: [0.9, 1.15, 0.9] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-2xl">🔄</span>
              <span className="text-[10px] font-black text-emerald-800 bg-white/90 px-1.5 py-0.5 rounded-full border border-emerald-300">
                重心平穩旋轉
              </span>
            </motion.div>

            {/* Comfy Sofa Right */}
            <div className="flex flex-col items-center">
              <span className="text-3xl">🛋️</span>
              <span className="text-[10px] font-bold text-emerald-700">安全入座</span>
            </div>
          </div>
        );

      // 13. 【自理】如廁安全握扶自理
      case 'toilet':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Toilet */}
            <div className="relative w-20 h-28 bg-white rounded-3xl border-3 border-stone-300 shadow-md flex flex-col items-center justify-between p-2">
              <div className="w-12 h-8 bg-stone-100 rounded-t-xl border border-stone-200" />
              <div className="w-14 h-12 bg-sky-100 rounded-full border border-sky-300" />
            </div>

            {/* Wall Safety Grab Bar glowing */}
            <motion.div
              className="absolute left-12 w-3 h-24 bg-amber-500 rounded-full border-2 border-amber-700 shadow-md"
              animate={{
                boxShadow: [
                  '0 0 0px rgba(245, 158, 11, 0.2)',
                  '0 0 14px rgba(245, 158, 11, 0.8)',
                  '0 0 0px rgba(245, 158, 11, 0.2)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-6 h-2 bg-stone-700 rounded-sm -ml-1.5 mt-2" />
              <div className="w-6 h-2 bg-stone-700 rounded-sm -ml-1.5 mt-14" />
            </motion.div>

            <div className="absolute top-5 right-8 text-xs font-black bg-white/90 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full shadow-xs">
              🛡️ 抓握扶手自立尊嚴
            </div>
          </div>
        );

      // 14. 【沖沐】洗澡椅淋浴沖沐
      case 'shower':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Shower Head */}
            <div className="absolute top-4 left-18 text-3xl">🚿</div>

            {/* Spraying water drops */}
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-4 bg-cyan-400 rounded-full blur-[0.5px]"
                style={{ left: `${36 + i * 8}%`, top: '28%' }}
                animate={{
                  y: [0, 48],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.25,
                  ease: 'easeIn',
                }}
              />
            ))}

            {/* Bath Chair with safety backrest */}
            <div className="absolute bottom-5 w-24 h-18 bg-white rounded-xl border-3 border-stone-300 shadow-md flex flex-col items-center justify-between p-1">
              <div className="w-20 h-5 bg-sky-200 rounded-md border border-sky-300" />
              <div className="w-full flex justify-between px-1">
                <div className="w-1.5 h-8 bg-stone-400 rounded-sm" />
                <div className="w-1.5 h-8 bg-stone-400 rounded-sm" />
              </div>
            </div>
          </div>
        );

      // 15. 【關鎖】巡視門窗開關防護
      case 'lock-windows':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Window Frame */}
            <div className="relative w-34 h-28 bg-sky-100 rounded-2xl border-4 border-amber-800 shadow-md grid grid-cols-2 gap-1 p-1">
              <div className="bg-sky-200/60 rounded-lg border border-white/60" />
              <div className="bg-sky-200/60 rounded-lg border border-white/60" />
            </div>

            {/* Rotating Security Lock */}
            <motion.div
              className="absolute w-10 h-10 bg-amber-500 rounded-full border-2 border-amber-700 shadow-md flex items-center justify-center text-white"
              animate={{ rotate: [0, 90, 90, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              🔒
            </motion.div>
          </div>
        );

      // 16. 【操輪】靈活推輪穿梭巡航
      case 'wheelchair':
        return (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Speed tracks on ground */}
            {[-40, 0, 40].map((x, idx) => (
              <motion.div
                key={idx}
                className="absolute bottom-6 h-1 bg-blue-400/50 rounded-full"
                style={{ width: '40px' }}
                animate={{ x: [80, -120] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: idx * 0.4, ease: 'linear' }}
              />
            ))}

            {/* Spinning Wheelchair wheel */}
            <motion.div
              className="relative w-20 h-20 rounded-full border-4 border-stone-800 shadow-md flex items-center justify-center"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            >
              <div className="w-18 h-18 rounded-full border-2 border-dashed border-stone-400" />
              <div className="w-4 h-4 rounded-full bg-blue-600" />
            </motion.div>

            <span className="absolute -top-1 text-2xl">🧑‍🦽</span>
          </div>
        );

      // 17. 【持拐】手持輔具步態對稱
      case 'walking-cane':
        return (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Ground */}
            <div className="absolute bottom-5 w-full h-2 bg-stone-300 border-t-2 border-stone-400" />

            {/* 1-2 Footstep markers */}
            {[-35, 10].map((offset, idx) => (
              <motion.div
                key={idx}
                className="absolute bottom-7 text-xs font-bold"
                style={{ left: `calc(50% + ${offset}px)` }}
                animate={{ scale: [0.8, 1.15, 0.8], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, delay: idx * 0.8 }}
              >
                🦶
              </motion.div>
            ))}

            {/* Cane moving forward */}
            <motion.div
              className="absolute w-2 h-26 bg-stone-700 rounded-full shadow-sm origin-top"
              style={{ bottom: '20px', left: '38%' }}
              animate={{
                rotate: [-10, 10, -10],
                x: [-10, 10, -10],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="w-5 h-2.5 bg-stone-900 rounded-full -ml-1.5" />
            </motion.div>
          </div>
        );

      // 18. 【越坡】平穩跨步走過緩坡
      case 'slope-walk':
        return (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Gentle Green Incline Slope */}
            <div
              className="absolute bottom-2 left-0 w-full h-14 bg-emerald-300 border-t-4 border-emerald-500 origin-bottom-left"
              style={{ transform: 'rotate(-12deg)' }}
            />

            {/* Character walking steadily up the slope */}
            <motion.div
              className="absolute text-3xl"
              animate={{
                x: [-60, 40, 40, -60],
                y: [20, -10, -10, 20],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              🚶‍♂️
            </motion.div>
          </div>
        );

      // 19. 【登階】一階一階登上階梯
      case 'stairs':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* 3 Step Stairs */}
            <div className="absolute bottom-5 left-12 flex items-end">
              <div className="w-12 h-8 bg-stone-300 border-2 border-stone-400" />
              <div className="w-12 h-16 bg-stone-300 border-2 border-stone-400" />
              <div className="w-12 h-24 bg-stone-300 border-2 border-stone-400" />
            </div>

            {/* Handrail */}
            <div className="absolute bottom-16 left-12 w-36 h-2 bg-amber-800 -rotate-28 rounded-full shadow-xs" />

            {/* Character ascending */}
            <motion.div
              className="absolute text-3xl"
              animate={{
                x: [-40, -5, 30, 30, -40],
                y: [12, -4, -20, -20, 12],
              }}
              transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              🚶
            </motion.div>
          </div>
        );

      // 20. 【漫步】漫步走向便利商店
      case 'store-walk':
        return (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Street scene */}
            <div className="absolute bottom-4 w-full h-3 bg-stone-300 border-t-2 border-stone-400" />

            {/* Passing trees */}
            {[-60, 50].map((pos, i) => (
              <motion.div
                key={i}
                className="absolute bottom-7 text-2xl"
                style={{ left: `calc(50% + ${pos}px)` }}
                animate={{ x: [40, -40] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              >
                🌳
              </motion.div>
            ))}

            {/* Shop awning right */}
            <div className="absolute right-4 bottom-7 text-3xl">🏪</div>

            {/* Walking Person */}
            <motion.div
              className="absolute text-3xl"
              animate={{
                x: [-50, 10, -50],
                y: [0, -3, 0],
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              🚶
            </motion.div>
          </div>
        );

      // 21. 【視訊】手機視訊通話
      case 'video-call':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Phone */}
            <div className="relative w-24 h-38 bg-stone-900 rounded-3xl border-3 border-stone-800 shadow-xl flex flex-col items-center justify-between p-2">
              <div className="w-full h-full bg-sky-100 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
                <motion.div
                  className="text-3xl"
                  animate={{ rotate: [-12, 12, -12] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                >
                  👧
                </motion.div>
                <div className="text-[10px] font-black text-sky-800 mt-1">視訊通話中</div>

                {/* Floating Love Hearts */}
                <motion.div
                  className="absolute bottom-2 text-sm"
                  animate={{ y: [0, -26], opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  💖
                </motion.div>
              </div>
            </div>
          </div>
        );

      // 22. 【分藥】按時取出藥格藥物
      case 'meds-clock':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Clock */}
            <div className="relative w-18 h-18 rounded-full bg-white border-3 border-purple-500 shadow-md flex items-center justify-center mr-4">
              <motion.div
                className="w-0.5 h-6 bg-purple-700 origin-bottom rounded-full"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              />
              <div className="w-1.5 h-1.5 rounded-full bg-purple-900" />
            </div>

            {/* 7-day pill organizer lid opening */}
            <div className="relative w-24 h-16 bg-purple-100 rounded-xl border-2 border-purple-300 shadow-md flex items-center justify-around p-1">
              <motion.div
                className="w-6 h-10 bg-white rounded-md border-2 border-purple-400 flex flex-col items-center justify-center text-xs shadow-xs"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                💊
              </motion.div>
              <div className="w-6 h-10 bg-purple-200 rounded-md" />
              <div className="w-6 h-10 bg-purple-200 rounded-md" />
            </div>
          </div>
        );

      // 23. 【提筆】提筆穩健簽名
      case 'handwriting':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Notepad */}
            <div className="relative w-38 h-28 bg-white rounded-xl border-2 border-stone-300 shadow-md p-3 flex flex-col justify-center gap-2">
              <div className="w-full h-0.5 bg-stone-200" />
              <div className="relative w-full h-6 flex items-center">
                <motion.div
                  className="h-1.5 bg-indigo-600 rounded-full"
                  animate={{ width: ['0%', '90%', '90%', '0%'] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
              <div className="w-full h-0.5 bg-stone-200" />
            </div>

            {/* Pen gliding */}
            <motion.div
              className="absolute w-2.5 h-20 bg-stone-800 rounded-t-md origin-bottom shadow-sm"
              animate={{
                x: [-35, 30, 30, -35],
                y: [-6, -2, -2, -6],
                rotate: [20, 25, 25, 20],
              }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="w-1.5 h-3 bg-amber-400 mx-auto -mb-1 rounded-b-xs" />
            </motion.div>
          </div>
        );

      // 24. 【算錢】打開錢包數鈔付現
      case 'cash-pay':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Leather Wallet */}
            <div className="relative w-28 h-20 bg-amber-800 rounded-xl border-3 border-amber-950 shadow-md flex items-center justify-center">
              <div className="w-20 h-10 bg-amber-700 rounded-md border border-amber-900 flex items-center justify-center text-white text-xs font-bold">
                👛 錢包
              </div>
            </div>

            {/* Sliding coins and bills */}
            <motion.div
              className="absolute text-xl"
              animate={{
                x: [-20, 30, 30, -20],
                y: [0, -15, -15, 0],
                scale: [0.8, 1.2, 1.2, 0.8],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              🪙 💵
            </motion.div>
          </div>
        );

      // 25. 【澆灌】為陽台盆栽澆水
      case 'watering-plants':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Potted Plant */}
            <div className="absolute bottom-5 right-18 flex flex-col items-center">
              <motion.div
                className="text-3xl"
                animate={{ scale: [1, 1.15, 1.15, 1] }}
                transition={{ duration: 3.2, repeat: Infinity }}
              >
                🪴
              </motion.div>
              <div className="w-14 h-9 bg-amber-800 rounded-b-xl border-2 border-amber-950 shadow-xs" />
            </div>

            {/* Watering Can */}
            <motion.div
              className="absolute left-14 bottom-14 text-4xl"
              animate={{
                rotate: [0, -32, -32, 0],
                y: [0, -8, -8, 0],
              }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              🫖
            </motion.div>

            {/* Water Drops */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-4 bg-cyan-400 rounded-full"
                style={{ left: `${46 + i * 4}%`, top: '46%' }}
                animate={{ y: [0, 24], opacity: [0, 1, 0] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: 'easeIn',
                }}
              />
            ))}
          </div>
        );

      // 26. 【落子】捏子與老友對弈
      case 'play-chess':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Chessboard */}
            <div className="relative w-34 h-26 bg-amber-100 rounded-xl border-3 border-amber-800 shadow-md grid grid-cols-4 grid-rows-3 gap-1 p-2">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div key={idx} className="border border-amber-300 rounded-xs" />
              ))}
            </div>

            {/* Chess Piece falling with crisp tap */}
            <motion.div
              className="absolute w-8 h-8 rounded-full bg-stone-900 border-2 border-stone-600 shadow-lg flex items-center justify-center text-white text-xs font-bold"
              animate={{
                y: [-30, 0, 0, -30],
                scale: [1.2, 0.95, 1, 1.2],
              }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              將
            </motion.div>

            {/* Ripple impact ring */}
            <motion.div
              className="absolute w-12 h-12 rounded-full border-2 border-amber-500"
              animate={{ scale: [0.6, 1.6], opacity: [1, 0] }}
              transition={{ duration: 2.6, repeat: Infinity }}
            />
          </div>
        );

      // 27. 【高歌】握麥歡唱回憶金曲
      case 'singing':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Microphone */}
            <motion.div
              className="relative w-8 h-26 bg-gradient-to-t from-stone-800 to-stone-600 rounded-full border-2 border-amber-400 shadow-lg flex flex-col items-center pt-1"
              animate={{
                rotate: [-10, 10, -10],
                y: [0, -6, 0],
              }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="w-7 h-8 bg-stone-300 rounded-full border border-stone-500" />
            </motion.div>

            {/* Floating musical notes */}
            {['🎵', '🎶', '✨', '🎤'].map((icon, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl"
                style={{ left: `${28 + i * 15}%`, bottom: '38%' }}
                animate={{
                  y: [-10, -48],
                  x: [0, (i % 2 === 0 ? 1 : -1) * 14],
                  opacity: [0, 1, 0],
                  scale: [0.8, 1.2, 0.9],
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  delay: i * 0.45,
                  ease: 'easeOut',
                }}
              >
                {icon}
              </motion.div>
            ))}
          </div>
        );

      // 28. 【馳遊】全家搭車踏青出遊
      case 'travel-car':
        return (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Rolling Hills in background */}
            <div className="absolute top-6 left-0 right-0 flex justify-around opacity-40">
              <span className="text-3xl">⛰️</span>
              <span className="text-4xl">🏔️</span>
              <span className="text-3xl">⛰️</span>
            </div>

            {/* Scenic Road */}
            <div className="absolute bottom-5 w-full h-3 bg-stone-300 border-t-2 border-stone-400" />

            {/* Cruising Family Car */}
            <motion.div
              className="absolute text-4xl"
              style={{ bottom: '16px' }}
              animate={{
                x: [-80, 80],
                y: [0, -2, 0],
              }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              🚗
            </motion.div>
          </div>
        );

      // Fallback
      default:
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <motion.div
              className="text-4xl"
              animate={{ scale: [0.95, 1.1, 0.95] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ✨
            </motion.div>
          </div>
        );
    }
  };

  // When showing custom video: completely clean, pure video player with ZERO overlays, badges or texts
  if (videoUrl && showVideo) {
    return (
      <div className={`relative w-full aspect-video min-h-[220px] max-h-[400px] bg-black overflow-hidden flex items-center justify-center ${className}`}>
        {youtubeEmbed ? (
          <iframe
            src={youtubeEmbed}
            title={actionVerbFull || '復健示範影片'}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            src={videoUrl}
            controls
            loop
            autoPlay
            muted
            playsInline
            className="w-full h-full object-contain"
          />
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => setInteractiveCount((c) => c + 1)}
      className={`relative w-full overflow-hidden bg-gradient-to-br ${getBgGradient()} border-b border-stone-200 select-none group cursor-pointer ${className}`}
      style={{ height: compact ? '160px' : '210px' }}
    >
      {/* Background ambient accents */}
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/40 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-white/30 rounded-full blur-lg pointer-events-none" />

      {/* Render the specific dynamic vector action scene */}
      {renderScene()}

      {/* Top Left: Category & Action Spotlight */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10 pointer-events-none">
        <span
          className={`px-2.5 py-1 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 ${getVerbBadgeColor()}`}
        >
          <span className="tracking-wide text-sm">{actionVerb}</span>
        </span>
      </div>

      {/* Top Right: Video Switch Button (if custom video is available) */}
      {videoUrl && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowVideo(true);
            }}
            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/95 text-stone-800 shadow-sm border border-stone-200 flex items-center gap-1 backdrop-blur-xs cursor-pointer hover:bg-stone-100 transition-all"
            title="切換為實拍影片"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>切換為實拍影片</span>
          </button>
        </div>
      )}

      {/* Bottom Full Action Phrase Bar */}
      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <span className="px-2.5 py-1 rounded-lg bg-stone-900/85 text-white text-xs font-bold backdrop-blur-xs flex items-center gap-1.5 shadow-sm truncate max-w-[85%]">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span className="truncate">{actionVerbFull}</span>
        </span>

        {interactiveCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-[10px] font-bold text-amber-900 bg-amber-300 px-2 py-0.5 rounded-full shadow-xs"
          >
            加油！
          </motion.span>
        )}
      </div>
    </div>
  );
};
