import React from 'react';
import './About.scss';
import { FiTarget, FiTrendingUp, FiBriefcase, FiUsers } from 'react-icons/fi';

const About = () => {
  return (
    <div className="about-page">
      <div className="hero-section">
        <h1>About GPT Deal Negotiator</h1>
        <p className="subtitle">AI-powered negotiation assistant that helps you get better deals</p>
      </div>
      
      <div className="about-section">
        <h2>Our Mission</h2>
        <p>
          GPT Deal Negotiator was created to level the playing field in negotiations. 
          Our mission is to provide everyone with the tools and techniques used by professional 
          negotiators, powered by advanced AI language models.
        </p>
        <p>
          Whether you're buying a car, selling your services, or negotiating a salary, 
          our app provides personalized, contextually-appropriate suggestions that help 
          you achieve better outcomes.
        </p>
      </div>
      
      <div className="features-section">
        <h2>Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <FiTarget />
            </div>
            <h3>Strategic Suggestions</h3>
            <p>
              Get AI-generated negotiation tactics tailored to your specific situation 
              and goals, whether buying or selling.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <FiTrendingUp />
            </div>
            <h3>Performance Tracking</h3>
            <p>
              Monitor your negotiation history, success rate, and the money you've 
              saved or earned through successful negotiations.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <FiBriefcase />
            </div>
            <h3>Multi-Industry Support</h3>
            <p>
              From real estate to salary negotiations, our system understands context 
              and provides industry-specific advice.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <FiUsers />
            </div>
            <h3>Negotiation Coaching</h3>
            <p>
              Learn as you go with built-in explanations of why certain approaches work 
              better in different scenarios.
            </p>
          </div>
        </div>
      </div>
      
      <div className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Set Your Parameters</h3>
              <p>
                Specify what you're negotiating, the starting price, your target price, 
                and whether you're buying or selling.
              </p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Start the Conversation</h3>
              <p>
                Begin your negotiation with the other party, either through our simulated 
                practice mode or in your real-world discussions.
              </p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Get AI Suggestions</h3>
              <p>
                Our advanced GPT-powered system will analyze the conversation and 
                suggest effective responses to help you reach your target price.
              </p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Track Your Results</h3>
              <p>
                After each negotiation, record the outcome to build your personal 
                negotiation statistics and improve future recommendations.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="testimonials">
        <h2>What Our Users Say</h2>
        <div className="testimonials-grid">
          <div className="testimonial">
            <p className="quote">
              "This app saved me $3,200 on my car purchase! The suggested responses 
              were incredibly effective and gave me confidence throughout the negotiation."
            </p>
            <p className="author">— Michael T., New York</p>
          </div>
          
          <div className="testimonial">
            <p className="quote">
              "As a freelancer, I've always struggled with pricing my services. 
              GPT Deal Negotiator helped me increase my rates by 30% with existing clients."
            </p>
            <p className="author">— Sarah K., San Francisco</p>
          </div>
          
          <div className="testimonial">
            <p className="quote">
              "The most valuable aspect is learning WHY certain negotiation tactics work. 
              I'm not just getting better deals, I'm becoming a better negotiator."
            </p>
            <p className="author">— David L., Chicago</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About; 