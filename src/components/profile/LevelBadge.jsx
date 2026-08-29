/**
 * VIBRA - Level Badge Component
 * Module: Levels & Points Engine
 * 
 * Displays user level badge with progress to next level.
 * Professional design - no emojis.
 */

import React, { useState, useEffect } from 'react';
import * as levelService from '../../services/levelService';

const LevelBadge = ({ userId, points, level, onLevelUp }) => {
  const [progress, setProgress] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (points !== undefined) {
      const data = levelService.getLevelProgress(points);
      setProgress(data);
    }
  }, [points]);

  if (!progress) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  const { currentLevel, nextLevel, progress: progressPercent, pointsNeeded, pointsToNext, isMaxLevel } = progress;

  const getLevelColor = (color) => {
    return color || '#CD7F32';
  };

  const getLevelEmoji = (emoji) => {
    return emoji || '🥉';
  };

  return (
    <div style={styles.container}>
      <div style={styles.badge}>
        <div 
          style={{
            ...styles.badgeIcon,
            backgroundColor: getLevelColor(currentLevel.color),
          }}
        >
          <span style={styles.badgeEmoji}>{getLevelEmoji(currentLevel.emoji)}</span>
        </div>
        <div style={styles.badgeInfo}>
          <div style={styles.badgeHeader}>
            <span style={styles.badgeLevel}>{currentLevel.label}</span>
            <button 
              onClick={() => setShowDetails(!showDetails)}
              style={styles.detailsToggle}
            >
              {showDetails ? 'Hide' : 'Details'}
            </button>
          </div>
          <span style={styles.badgePoints}>{points || 0} points</span>
        </div>
      </div>

      {!isMaxLevel && (
        <div style={styles.progressContainer}>
          <div style={styles.progressHeader}>
            <span style={styles.progressLabel}>
              Progress to {nextLevel.label}
            </span>
            <span style={styles.progressPercent}>{progressPercent}%</span>
          </div>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${progressPercent}%`,
                backgroundColor: getLevelColor(nextLevel.color),
              }}
            />
          </div>
          <div style={styles.progressDetails}>
            <span style={styles.progressPoints}>
              {pointsToNext > 0 ? `${pointsToNext} points needed` : 'Ready to level up!'}
            </span>
          </div>
        </div>
      )}

      {isMaxLevel && (
        <div style={styles.maxLevelContainer}>
          <p style={styles.maxLevelText}>Maximum Level Achieved</p>
        </div>
      )}

      {showDetails && (
        <div style={styles.detailsPanel}>
          <h4 style={styles.detailsTitle}>Level Perks</h4>
          <ul style={styles.detailsList}>
            <li>Photos: {currentLevel.perks.maxPhotos === -1 ? 'Unlimited' : currentLevel.perks.maxPhotos}</li>
            <li>Boosts per week: {currentLevel.perks.boostsPerWeek}</li>
            <li>Priority Inbox: {currentLevel.perks.priorityInbox ? 'Yes' : 'No'}</li>
            <li>Free Premium: {currentLevel.perks.freePremium ? 'Yes' : 'No'}</li>
            <li>Featured Profile: {currentLevel.perks.featuredProfile ? 'Yes' : 'No'}</li>
            <li>VIP Events: {currentLevel.perks.vipEvents ? 'Yes' : 'No'}</li>
          </ul>

          {nextLevel && (
            <div style={styles.nextLevelInfo}>
              <p style={styles.nextLevelTitle}>Next Level: {nextLevel.label}</p>
              <ul style={styles.detailsList}>
                <li>Photos: {nextLevel.perks.maxPhotos === -1 ? 'Unlimited' : nextLevel.perks.maxPhotos}</li>
                <li>Boosts per week: {nextLevel.perks.boostsPerWeek}</li>
                <li>Priority Inbox: {nextLevel.perks.priorityInbox ? 'Yes' : 'No'}</li>
                <li>Free Premium: {nextLevel.perks.freePremium ? 'Yes' : 'No'}</li>
                <li>Featured Profile: {nextLevel.perks.featuredProfile ? 'Yes' : 'No'}</li>
                <li>VIP Events: {nextLevel.perks.vipEvents ? 'Yes' : 'No'}</li>
              </ul>
              <p style={styles.nextLevelPoints}>
                Points needed: {nextLevel.pointsRequired - points}
              </p>
            </div>
          )}
        </div>
      )}

      <p style={styles.credit}>
        Powered by LabelReach
      </p>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '20px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  loading: {
    textAlign: 'center',
    color: '#888',
    padding: '20px',
    fontSize: '14px',
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
  },
  badgeIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  badgeEmoji: {
    fontSize: '28px',
  },
  badgeInfo: {
    flex: 1,
    minWidth: 0,
  },
  badgeHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  badgeLevel: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1a1a1a',
  },
  badgePoints: {
    fontSize: '14px',
    color: '#666',
    display: 'block',
    marginTop: '2px',
  },
  detailsToggle: {
    background: 'none',
    border: 'none',
    color: '#6C3CE1',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '4px 8px',
    fontFamily: 'inherit',
  },
  progressContainer: {
    marginTop: '8px',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#666',
    marginBottom: '6px',
  },
  progressLabel: {
    fontWeight: '500',
  },
  progressPercent: {
    fontWeight: '600',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.5s ease',
  },
  progressDetails: {
    marginTop: '6px',
    fontSize: '12px',
    color: '#888',
    textAlign: 'center',
  },
  progressPoints: {
    fontWeight: '500',
  },
  maxLevelContainer: {
    marginTop: '8px',
    padding: '12px',
    backgroundColor: '#f0edff',
    borderRadius: '10px',
    textAlign: 'center',
  },
  maxLevelText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6C3CE1',
    margin: 0,
  },
  detailsPanel: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#f8f8f8',
    borderRadius: '12px',
  },
  detailsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0 0 8px 0',
  },
  detailsList: {
    margin: 0,
    paddingLeft: '18px',
    fontSize: '13px',
    color: '#555',
    lineHeight: '1.8',
  },
  nextLevelInfo: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e0e0e0',
  },
  nextLevelTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 6px 0',
  },
  nextLevelPoints: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#6C3CE1',
    margin: '8px 0 0 0',
  },
  credit: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#bbb',
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px solid #f0f0f0',
  },
};

export default LevelBadge;