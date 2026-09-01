/**
 * VIBRA - Search Page Component
 * Module: Search
 * 
 * Search for users by location, name, phone, or matching criteria.
 * Fully mobile responsive.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as chatService from '../../services/chatService';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.vibra.ng/api';

const LIFE_GOALS_OPTIONS = [
  'Ready to settle down & buy a home',
  'Focusing heavily on career/building wealth',
  'Looking to travel extensively before settling',
  'Open to anything, going with the flow',
  'Building a family and raising children',
  'Focusing on personal growth and self-improvement',
  'Ready for marriage within 1-2 years',
];

const DEALBREAKERS_OPTIONS = [
  'Must want children',
  'Must not want children',
  'Must be non-smoker',
  'Must be Christian',
  'Must be Muslim',
  'Must be financially stable',
  'Must be ambitious',
  'Must be family-oriented',
  'Must have a degree',
  'Must be fit/active',
  'Must not have children',
  'No dealbreakers - open to anyone',
];

const DATING_PACE_OPTIONS = [
  { value: 'fast', label: 'Fast Tracker' },
  { value: 'medium', label: 'Vetter' },
  { value: 'slow', label: 'Pen Pal' },
];

const LIFESTYLE_OPTIONS = [
  { value: 'homebody', label: 'Homebody & Budget-Conscious' },
  { value: 'luxury', label: 'Fine Dining & High Luxury' },
  { value: 'adventurer', label: 'Outdoor Adventurer & Backpacking' },
  { value: 'social', label: 'Social Butterfly' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'fitness', label: 'Fitness Enthusiast' },
];

const SearchPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('location');
  const [results, setResults] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  // Filter states
  const [filters, setFilters] = useState({
    lifeGoals: '',
    dealbreakers: '',
    datingPace: '',
    lifestyle: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin_users.php`);
      const data = await response.json();
      if (data.success) {
        const filtered = data.users.filter(u => u.id !== user?.id);
        setAllUsers(filtered);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = (users) => {
    let filtered = users;

    if (filters.lifeGoals) {
      filtered = filtered.filter(u => u.lifeGoals === filters.lifeGoals);
    }
    if (filters.dealbreakers) {
      filtered = filtered.filter(u => u.dealbreakers === filters.dealbreakers);
    }
    if (filters.datingPace) {
      filtered = filtered.filter(u => u.datingPace === filters.datingPace);
    }
    if (filters.lifestyle) {
      filtered = filtered.filter(u => u.lifestyle === filters.lifestyle);
    }

    return filtered;
  };

  const handleSearch = () => {
    if (!searchQuery.trim() && !showFilters) {
      setResults([]);
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let filtered = allUsers;

      // Apply text search
      if (searchQuery.trim()) {
        if (searchType === 'location') {
          filtered = filtered.filter(u => 
            u.location && u.location.toLowerCase().includes(searchQuery.toLowerCase())
          );
        } else {
          filtered = filtered.filter(u => 
            u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.phone?.includes(searchQuery)
          );
        }
      }

      // Apply filters
      filtered = applyFilters(filtered);

      if (filtered.length === 0 && searchQuery.trim()) {
        setSuggestions([
          'No users found matching your criteria',
          'Try removing some filters',
          'Try a different search',
        ]);
        setResults([]);
      } else {
        setResults(filtered);
        setSuggestions([]);
      }
    } catch (err) {
      setError('Failed to search');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleChat = async (otherUserId) => {
    try {
      const conversation = await chatService.getOrCreateConversation(user.id, otherUserId);
      navigate(`/chat/${conversation.id}`);
    } catch (err) {
      console.error('Failed to start chat:', err);
      alert('Failed to start chat. Please try again.');
    }
  };

  const clearFilters = () => {
    setFilters({
      lifeGoals: '',
      dealbreakers: '',
      datingPace: '',
      lifestyle: '',
    });
    setSearchQuery('');
    setResults([]);
    setSuggestions([]);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h3 style={styles.title}>Search People</h3>
        <p style={styles.subtitle}>Find people by location, name, phone, or preferences</p>

        <div style={styles.toggleContainer}>
          <button
            style={{
              ...styles.toggleButton,
              ...(searchType === 'location' ? styles.toggleActive : {}),
            }}
            onClick={() => setSearchType('location')}
          >
            Location
          </button>
          <button
            style={{
              ...styles.toggleButton,
              ...(searchType === 'name' ? styles.toggleActive : {}),
            }}
            onClick={() => setSearchType('name')}
          >
            Name / Phone
          </button>
          <button
            style={{
              ...styles.toggleButton,
              ...(showFilters ? styles.toggleActive : {}),
            }}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </button>
        </div>

        <div style={styles.searchContainer}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              searchType === 'location' 
                ? 'Lagos, Yaba, Abuja...' 
                : 'Name or phone number'
            }
            style={styles.searchInput}
          />
          <button onClick={handleSearch} style={styles.searchButton}>
            Search
          </button>
        </div>

        {showFilters && (
          <div style={styles.filterContainer}>
            <div style={styles.filterRow}>
              <select
                name="lifeGoals"
                value={filters.lifeGoals}
                onChange={handleFilterChange}
                style={styles.filterSelect}
              >
                <option value="">Life Goals (Any)</option>
                {LIFE_GOALS_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>

              <select
                name="dealbreakers"
                value={filters.dealbreakers}
                onChange={handleFilterChange}
                style={styles.filterSelect}
              >
                <option value="">Dealbreaker (Any)</option>
                {DEALBREAKERS_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div style={styles.filterRow}>
              <select
                name="datingPace"
                value={filters.datingPace}
                onChange={handleFilterChange}
                style={styles.filterSelect}
              >
                <option value="">Dating Pace (Any)</option>
                {DATING_PACE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              <select
                name="lifestyle"
                value={filters.lifestyle}
                onChange={handleFilterChange}
                style={styles.filterSelect}
              >
                <option value="">Lifestyle (Any)</option>
                {LIFESTYLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <button onClick={clearFilters} style={styles.clearFiltersButton}>
              Clear All Filters
            </button>
          </div>
        )}

        {suggestions.length > 0 && (
          <div style={styles.suggestionsContainer}>
            {suggestions.map((suggestion, index) => (
              <p key={index} style={styles.suggestionText}>{suggestion}</p>
            ))}
          </div>
        )}

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div style={styles.loading}>Searching...</div>
        ) : results.length > 0 ? (
          <div style={styles.resultsContainer}>
            <p style={styles.resultCount}>{results.length} user{results.length > 1 ? 's' : ''} found</p>
            {results.map((u) => (
              <div
                key={u.id}
                style={styles.resultCard}
              >
                <div style={styles.resultAvatar} onClick={() => handleUserClick(u.id)}>
                  {u.profilePhoto ? (
                    <img src={u.profilePhoto} alt={u.name} style={styles.avatarImage} />
                  ) : (
                    <div style={styles.avatarPlaceholder}>{u.name?.[0] || '?'}</div>
                  )}
                </div>
                <div style={styles.resultInfo} onClick={() => handleUserClick(u.id)}>
                  <span style={styles.resultName}>
                    {u.name}
                    {u.isVerified && <span style={styles.verifiedBadge}> ✓</span>}
                  </span>
                  <span style={styles.resultDetails}>
                    {u.location || 'Location not set'} • {u.level || 'Bronze'}
                  </span>
                  {u.lifeGoals && (
                    <span style={styles.resultTag}>🎯 {u.lifeGoals}</span>
                  )}
                  {u.datingPace && (
                    <span style={styles.resultTag}>⏱️ {u.datingPace}</span>
                  )}
                  <span style={styles.resultPhone}>{u.phone}</span>
                </div>
                <button
                  onClick={() => handleChat(u.id)}
                  style={styles.chatButton}
                >
                  💬 Chat
                </button>
              </div>
            ))}
          </div>
        ) : searchQuery || showFilters ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No users found</p>
            <p style={styles.emptySubtext}>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Start searching</p>
            <p style={styles.emptySubtext}>Enter a location, name, or phone</p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    padding: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    width: '100%',
    boxSizing: 'border-box',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '20px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
    boxSizing: 'border-box',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 16px 0',
  },
  toggleContainer: {
    display: 'flex',
    gap: '6px',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  toggleButton: {
    padding: '8px 14px',
    borderRadius: '20px',
    border: '2px solid #e0e0e0',
    backgroundColor: 'white',
    fontSize: '13px',
    fontWeight: '500',
    color: '#666',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    flex: '1 0 auto',
    textAlign: 'center',
    minWidth: '80px',
  },
  toggleActive: {
    borderColor: '#6C3CE1',
    backgroundColor: '#f0edff',
    color: '#6C3CE1',
  },
  searchContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    width: '100%',
  },
  searchInput: {
    flex: 1,
    padding: '12px 14px',
    fontSize: '14px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
    minWidth: '0',
    width: '100%',
    boxSizing: 'border-box',
  },
  searchButton: {
    padding: '12px 18px',
    backgroundColor: '#6C3CE1',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  filterContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
  },
  filterRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
  },
  filterSelect: {
    flex: 1,
    padding: '10px 12px',
    fontSize: '13px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: 'white',
    fontFamily: 'inherit',
  },
  clearFiltersButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  suggestionsContainer: {
    backgroundColor: '#fff3cd',
    borderRadius: '10px',
    padding: '10px 14px',
    marginBottom: '16px',
    border: '1px solid #ffc107',
  },
  suggestionText: {
    fontSize: '13px',
    color: '#856404',
    margin: '2px 0',
  },
  resultsContainer: {
    maxHeight: '400px',
    overflowY: 'auto',
  },
  resultCount: {
    fontSize: '14px',
    color: '#888',
    margin: '0 0 12px 0',
  },
  resultCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    backgroundColor: '#f8f8f8',
    borderRadius: '12px',
    marginBottom: '8px',
  },
  resultAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: '#6C3CE1',
    cursor: 'pointer',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#6C3CE1',
  },
  resultInfo: {
    flex: 1,
    minWidth: 0,
    cursor: 'pointer',
  },
  resultName: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a1a',
  },
  verifiedBadge: {
    color: '#00B894',
    fontSize: '13px',
  },
  resultTag: {
    display: 'inline-block',
    fontSize: '11px',
    color: '#6C3CE1',
    backgroundColor: '#f0edff',
    padding: '2px 8px',
    borderRadius: '10px',
    marginRight: '4px',
    marginTop: '2px',
  },
  resultDetails: {
    display: 'block',
    fontSize: '12px',
    color: '#666',
  },
  resultPhone: {
    display: 'block',
    fontSize: '11px',
    color: '#999',
  },
  chatButton: {
    padding: '8px 16px',
    backgroundColor: '#6C3CE1',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  emptyState: {
    textAlign: 'center',
    padding: '30px 16px',
  },
  emptyText: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#666',
    margin: 0,
  },
  emptySubtext: {
    fontSize: '13px',
    color: '#999',
    margin: '4px 0 0 0',
  },
  loading: {
    textAlign: 'center',
    color: '#888',
    padding: '20px',
    fontSize: '14px',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    borderRadius: '8px',
    padding: '8px 12px',
    marginBottom: '12px',
    border: '1px solid #ffcdd2',
  },
  errorText: {
    color: '#c62828',
    fontSize: '13px',
    margin: 0,
  },
};

export default SearchPage;