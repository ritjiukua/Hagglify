import React, { useState } from 'react';
import { FiHelpCircle, FiBook, FiVideo, FiMail, FiMessageSquare, FiChevronRight, FiPlus, FiMinus, FiSend } from 'react-icons/fi';
import './HelpResources.scss';

const HelpResources = () => {
  const [activeTab, setActiveTab] = useState('faqs');
  const [expandedFaqs, setExpandedFaqs] = useState([]);
  
  // FAQ data
  const faqs = [
    {
      id: 1,
      question: 'What is GPT Deal Negotiator and how does it work?',
      answer: 'GPT Deal Negotiator is an AI-powered tool that helps you craft effective negotiation messages for various scenarios. It analyzes your situation and the other party\'s position to suggest optimal negotiation strategies and specific language to use.'
    },
    {
      id: 2,
      question: 'Is my data kept private when using the negotiation assistant?',
      answer: 'Yes, your data privacy is our priority. All information you share is encrypted and we do not store the specifics of your negotiations long-term. We only use anonymized patterns to improve our AI models. You can delete your data at any time from your account settings.'
    },
    {
      id: 3,
      question: 'What types of negotiations can I use this tool for?',
      answer: 'Our tool can help with a wide range of negotiations including salary discussions, buying and selling items, real estate transactions, business deals, service pricing, and more. We have specialized templates for common scenarios and can also assist with custom negotiations.'
    },
    {
      id: 4,
      question: 'How accurate are the AI-generated suggestions?',
      answer: 'Our AI suggestions are based on successful negotiation strategies and data from thousands of real-world negotiations. While no tool can guarantee success in every situation, our users report an average of 23% better outcomes when using our suggested approaches compared to their initial strategies.'
    },
    {
      id: 5,
      question: 'Can I customize the negotiation templates?',
      answer: 'Absolutely! You can fully customize any template or AI suggestion to match your specific situation. We recommend using our AI suggestions as a strong starting point, then adding your personal touch to make it authentic and appropriate for your relationship with the other party.'
    },
    {
      id: 6,
      question: 'Is there a limit to how many negotiations I can create?',
      answer: 'Free accounts can create up to 5 negotiations per month. Premium subscribers have unlimited negotiations and access to advanced features like sentiment analysis and advanced counteroffers. Check our pricing page for full details on plan limits.'
    },
  ];
  
  // Guide data
  const guides = [
    {
      id: 1,
      title: 'Negotiation Fundamentals',
      description: 'Learn the core principles of effective negotiations that apply across all scenarios.',
      link: '/guides/negotiation-fundamentals',
      icon: 'book'
    },
    {
      id: 2,
      title: 'Salary Negotiation Playbook',
      description: 'Master the art of negotiating your compensation with confidence and data.',
      link: '/guides/salary-negotiation',
      icon: 'briefcase'
    },
    {
      id: 3,
      title: 'Real Estate Deal Tactics',
      description: 'Strategies for getting the best terms when buying or selling property.',
      link: '/guides/real-estate-tactics',
      icon: 'home'
    },
    {
      id: 4,
      title: 'Business Negotiation Guide',
      description: 'Close better business deals with these proven approaches to B2B negotiations.',
      link: '/guides/business-negotiation',
      icon: 'trending-up'
    }
  ];
  
  // Video data
  const videos = [
    {
      id: 1,
      title: 'Negotiation Psychology Explained',
      description: 'Understand the psychological principles that influence negotiation outcomes.',
      link: 'https://www.youtube.com/watch?v=example1',
      thumbnail: '/images/video-thumb-1.jpg',
      duration: '12:34'
    },
    {
      id: 2,
      title: 'Body Language in Negotiations',
      description: 'Learn to read and use body language effectively during in-person negotiations.',
      link: 'https://www.youtube.com/watch?v=example2',
      thumbnail: '/images/video-thumb-2.jpg',
      duration: '8:45'
    },
    {
      id: 3,
      title: 'Handling Difficult Negotiators',
      description: 'Strategies for maintaining control when dealing with aggressive counterparts.',
      link: 'https://www.youtube.com/watch?v=example3',
      thumbnail: '/images/video-thumb-3.jpg',
      duration: '15:20'
    },
    {
      id: 4,
      title: 'Digital Negotiation Tactics',
      description: 'Special considerations for negotiations conducted via email, chat, or video calls.',
      link: 'https://www.youtube.com/watch?v=example4',
      thumbnail: '/images/video-thumb-4.jpg',
      duration: '10:15'
    }
  ];
  
  // Toggle FAQ expansion
  const toggleFaq = (faqId) => {
    if (expandedFaqs.includes(faqId)) {
      setExpandedFaqs(expandedFaqs.filter(id => id !== faqId));
    } else {
      setExpandedFaqs([...expandedFaqs, faqId]);
    }
  };
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-title">
          <h1>Help & Resources</h1>
          <p>Find answers to common questions and learn how to master negotiations</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary">
            <FiMessageSquare /> Contact Support
          </button>
        </div>
      </div>
      
      <div className="page-content">
        <div className="help-tabs">
          <button 
            className={`tab-button ${activeTab === 'faqs' ? 'active' : ''}`}
            onClick={() => setActiveTab('faqs')}
          >
            <FiHelpCircle /> Frequently Asked Questions
          </button>
          <button 
            className={`tab-button ${activeTab === 'guides' ? 'active' : ''}`}
            onClick={() => setActiveTab('guides')}
          >
            <FiBook /> Guides & Articles
          </button>
          <button 
            className={`tab-button ${activeTab === 'videos' ? 'active' : ''}`}
            onClick={() => setActiveTab('videos')}
          >
            <FiVideo /> Video Tutorials
          </button>
          <button 
            className={`tab-button ${activeTab === 'contact' ? 'active' : ''}`}
            onClick={() => setActiveTab('contact')}
          >
            <FiMail /> Contact Support
          </button>
        </div>
        
        <div className="help-content">
          {activeTab === 'faqs' && (
            <div className="faqs-section">
              <h2>Frequently Asked Questions</h2>
              <div className="faq-list">
                {faqs.map(faq => (
                  <div 
                    key={faq.id} 
                    className={`faq-item ${expandedFaqs.includes(faq.id) ? 'expanded' : ''}`}
                    onClick={() => toggleFaq(faq.id)}
                  >
                    <div className="faq-question">
                      <h3>{faq.question}</h3>
                      {expandedFaqs.includes(faq.id) ? <FiMinus /> : <FiPlus />}
                    </div>
                    {expandedFaqs.includes(faq.id) && (
                      <div className="faq-answer">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'guides' && (
            <div className="guides-section">
              <h2>Guides & Articles</h2>
              <p className="section-description">
                Comprehensive resources to help you become a negotiation expert
              </p>
              <div className="guides-grid">
                {guides.map(guide => (
                  <div className="guide-card" key={guide.id}>
                    <div className="guide-card-content">
                      <h3>{guide.title}</h3>
                      <p>{guide.description}</p>
                    </div>
                    <a href={guide.link} className="guide-link">
                      Read Guide <FiChevronRight />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'videos' && (
            <div className="videos-section">
              <h2>Video Tutorials</h2>
              <p className="section-description">
                Watch and learn negotiation techniques from our experts
              </p>
              <div className="videos-grid">
                {videos.map(video => (
                  <div className="video-card" key={video.id}>
                    <div className="video-thumbnail">
                      <img src={video.thumbnail} alt={video.title} />
                      <span className="video-duration">{video.duration}</span>
                    </div>
                    <div className="video-info">
                      <h3>{video.title}</h3>
                      <p>{video.description}</p>
                      <a href={video.link} className="video-link" target="_blank" rel="noopener noreferrer">
                        Watch Video <FiChevronRight />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'contact' && (
            <div className="contact-section">
              <h2>Contact Support</h2>
              <p className="section-description">
                Our team is ready to help with any questions or issues
              </p>
              
              <div className="support-options">
                <div className="support-option">
                  <FiMessageSquare className="support-icon" />
                  <h3>Live Chat</h3>
                  <p>Chat with our support team in real-time during business hours</p>
                  <button className="btn btn-primary">Start Chat</button>
                </div>
                
                <div className="support-option">
                  <FiMail className="support-icon" />
                  <h3>Email Support</h3>
                  <p>Send us an email and we'll respond within 24 hours</p>
                  <a href="mailto:support@example.com" className="btn btn-primary">Email Us</a>
                </div>
                
                <div className="support-option">
                  <FiHelpCircle className="support-icon" />
                  <h3>Support Ticket</h3>
                  <p>Submit a detailed ticket for complex issues</p>
                  <button className="btn btn-primary">Open Ticket</button>
                </div>
              </div>
              
              <div className="contact-form">
                <h3>Send a Message</h3>
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input type="text" id="name" placeholder="Your name" />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" placeholder="Your email address" />
                </div>
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input type="text" id="subject" placeholder="What is this regarding?" />
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" rows="4" placeholder="How can we help you?"></textarea>
                </div>
                <button className="btn btn-primary">
                  <FiSend /> Send Message
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpResources;