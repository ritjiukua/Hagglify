import React, { useState } from 'react';
import './Templates.scss';
import { FiPlus, FiEdit2, FiTrash2, FiCopy, FiSearch, FiInfo } from 'react-icons/fi';

const Templates = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dummy template data
  const categories = [
    { id: 'all', name: 'All Templates' },
    { id: 'buying', name: 'Buying' },
    { id: 'selling', name: 'Selling' },
    { id: 'salary', name: 'Salary Negotiation' },
    { id: 'real-estate', name: 'Real Estate' },
    { id: 'services', name: 'Services' },
    { id: 'custom', name: 'Custom' },
  ];
  
  const templates = [
    {
      id: 1,
      title: 'Price Reduction Request',
      category: 'buying',
      content: 'I have been researching similar items and noticed they typically sell for around [LOWER_PRICE]. Would you consider adjusting your price to be more in line with the market?',
      usage: 28,
      success: 75,
    },
    {
      id: 2,
      title: 'Value Justification',
      category: 'selling',
      content: 'I understand youre looking for the best deal, but this [ITEM] offers several premium features not found in lower-priced alternatives, including [FEATURE_1] and [FEATURE_2], which justify the higher price point.',
      usage: 42,
      success: 82,
    },
    {
      id: 3,
      title: 'Salary Increase Request',
      category: 'salary',
      content: 'Based on my performance and contributions to [PROJECTS], along with market research showing the industry average for this role is [MARKET_RATE], Id like to discuss adjusting my compensation to [TARGET_SALARY].',
      usage: 15,
      success: 68,
    },
    {
      id: 4,
      title: 'Bundle Discount Offer',
      category: 'buying',
      content: 'Im interested in purchasing multiple items, specifically [ITEM_1], [ITEM_2], and [ITEM_3]. Would you be willing to offer a bundle discount if I purchase all of these together?',
      usage: 19,
      success: 85,
    },
    {
      id: 5,
      title: 'Conditional Concession',
      category: 'selling',
      content: 'I could consider lowering the price to [TARGET_PRICE] if we can agree to [CONDITION], such as a faster payment timeline or a minimum purchase quantity.',
      usage: 31,
      success: 79,
    },
    {
      id: 6,
      title: 'Real Estate Initial Offer',
      category: 'real-estate',
      content: 'After careful consideration of comparable properties in the area and factoring in [PROPERTY_ISSUES], Id like to make an initial offer of [OFFER_PRICE], which I believe is fair based on current market conditions.',
      usage: 7,
      success: 62,
    },
    {
      id: 7,
      title: 'Service Rate Explanation',
      category: 'services',
      content: 'My rate of [RATE] reflects my [YEARS] years of experience and specialized expertise in [FIELD]. I deliver exceptional value through [VALUE_PROP_1] and [VALUE_PROP_2], which ultimately saves you time and money.',
      usage: 22,
      success: 71,
    },
    {
      id: 8,
      title: 'Final Counteroffer',
      category: 'buying',
      content: 'Thank you for considering my previous offer. Id like to present my final offer of [FINAL_PRICE]. This represents the absolute maximum I can invest in this purchase while still meeting my budget constraints.',
      usage: 33,
      success: 65,
    },
  ];
  
  // Filter templates based on active category and search query
  const filteredTemplates = templates.filter(template => {
    const matchesCategory = activeCategory === 'all' || template.category === activeCategory;
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          template.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-title">
          <h1>Negotiation Templates</h1>
          <p>Save and reuse effective negotiation messages for different scenarios</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary">
            <FiPlus /> Create New Template
          </button>
        </div>
      </div>
      
      <div className="page-content">
        <div className="templates-filter-bar">
          <div className="categories-tabs">
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
          
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {filteredTemplates.length > 0 ? (
          <div className="templates-grid">
            {filteredTemplates.map(template => (
              <div className="template-card" key={template.id}>
                <div className="template-header">
                  <h3>{template.title}</h3>
                  <span className={`badge badge-${template.category === 'buying' ? 'info' : template.category === 'selling' ? 'success' : 'warning'}`}>
                    {template.category}
                  </span>
                </div>
                
                <div className="template-content">
                  {template.content}
                </div>
                
                <div className="template-stats">
                  <div className="stat">
                    <span className="stat-label">Used</span>
                    <span className="stat-value">{template.usage} times</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Success Rate</span>
                    <span className="stat-value">{template.success}%</span>
                  </div>
                </div>
                
                <div className="template-actions">
                  <button className="btn btn-sm btn-secondary">
                    <FiCopy /> Use
                  </button>
                  <button className="btn btn-sm btn-secondary">
                    <FiEdit2 /> Edit
                  </button>
                  <button className="btn btn-sm btn-danger">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-templates">
            <FiInfo size={48} className="empty-icon" />
            <h3>No templates found</h3>
            <p>Try changing your search criteria or create a new template.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Templates; 