import { motion } from 'framer-motion';
import { clueVariants, renderCensoredDescription, renderUncensoredDescription } from './utils';

interface ClueExtrasProps {
  achievements?: { name: string; desc?: string; img: string }[];
  achievementsTotal?: number;
  show: boolean;
  isComplete?: boolean;
}

export const ClueExtras: React.FC<ClueExtrasProps> = ({
  achievements,
  achievementsTotal,
  show,
  isComplete = false,
}) => {
  const renderText = isComplete ? renderUncensoredDescription : renderCensoredDescription;
  const hasAchievements = (achievements?.length ?? 0) > 0;

  if (!hasAchievements) return null;

  const achCount = achievements!.length;

  const achLabel =
    achievementsTotal != null && achievementsTotal > achCount
      ? `Achievements (${achCount} of ${achievementsTotal})`
      : 'Achievements';

  const sectionLabel = `${achLabel}:`;

  return (
    <motion.div
      layout
      initial={false}
      animate={show ? 'visible' : 'hidden'}
      variants={clueVariants}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className='overflow-hidden'
    >
      <div className='px-4 py-3'>
        <div className='text-gray-400 text-xs uppercase mb-3'>
          {sectionLabel}
        </div>

        {/* Achievements list */}
        {hasAchievements && (
          <div className='flex flex-col gap-3'>
            {achievements!.map((achievement, idx) => (
              <div key={idx} className='flex items-center gap-3'>
                <img
                  src={achievement.img}
                  alt={achievement.name}
                  draggable={false}
                  style={{
                    width: 64,
                    height: 64,
                    flexShrink: 0,
                    objectFit: 'contain',
                  }}
                  className='rounded'
                  onContextMenu={(e) => e.preventDefault()}
                />
                <div className='flex flex-col justify-center'>
                  <span className='text-sm text-gray-200 leading-snug'>
                    {renderText(
                      achievement.name,
                      `ach-name-${idx}-`,
                    )}
                  </span>
                  {achievement.desc && (
                    <span className='text-xs text-gray-400 leading-snug mt-0.5'>
                      {renderText(
                        achievement.desc,
                        `ach-desc-${idx}-`,
                      )}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
