/**
 * VIBRA - Search Page Component
 * Module: Search
 * 
 * Search for users by location, name, or phone.
 * Shows nearest locations if exact match not found.
 * Fully mobile responsive.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as adminService from '../../services/adminService';
import { useNavigate } from 'react-router-dom';

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

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const users = await adminService.getAllUsers();
      const filtered = users.filter(u => u.id !== user?.id);
      setAllUsers(filtered);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let filtered = [];
      let exactMatches = [];
      let partialMatches = [];

      if (searchType === 'location') {
        filtered = allUsers.filter(u => 
          u.location && u.location.toLowerCase().includes(searchQuery.toLowerCase())
        );

        exactMatches = filtered.filter(u => 
          u.location.toLowerCase() === searchQuery.toLowerCase()
        );
        partialMatches = filtered.filter(u => 
          u.location.toLowerCase() !== searchQuery.toLowerCase() &&
          u.location.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (exactMatches.length === 0 && partialMatches.length > 0) {
          setResults(partialMatches);
          setSuggestions([]);
        } else if (exactMatches.length === 0 && partialMatches.length === 0) {
          setResults([]);
          setSuggestions([
            'No users found in this location',
            'Try a different location',
            'Browse all users'
          ]);
        } else {
          setResults([...exactMatches, ...partialMatches]);
          setSuggestions([]);
        }
      } else {
        filtered = allUsers.filter(u => 
          u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.phone?.includes(searchQuery)
        );
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

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h3 style={styles.title}>Search People</h3>
        <p style={styles.subtitle}>Find people by location, name, or phone</p>

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
                onClick={() => handleUserClick(u.id)}
              >
                <div style={styles.resultAvatar}>
                  {u.profilePhoto ? (
                    <img src={u.profilePhoto} alt={u.name} style={styles.avatarImage} />
                  ) : (
                    <div style={styles.avatarPlaceholder}>{u.name?.[0] || '?'}</div>
                  )}
                </div>
                <div style={styles.resultInfo}>
                  <span style={styles.resultName}>
                    {u.name}
                    {u.isVerified && <span style={styles.verifiedBadge}> ✓</span>}
                  </span>
                  <span style={styles.resultDetails}>
                    {u.location || 'Location not set'} • {u.level || 'Bronze'}
                  </span>
                  <span style={styles.resultPhone}>{u.phone}</span>
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery && !isLoading ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No users found</p>
            <p style={styles.emptySubtext}>Try a different search</p>
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
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  resultAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: '#6C3CE1',
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