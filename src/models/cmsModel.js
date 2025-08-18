const mongoose = require('mongoose');

// Hero Section Schema
const heroSectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: "INDIA'S DEFENCE MARKETPLACE"
  },
  subtitle: {
    type: String,
    required: true,
    default: "STRATEGIC • SECURE • SEAMLESS"
  },
  description: {
    type: String,
    required: true,
    default: "We connect OEMs, MSMEs, and component suppliers with verified buyers, enabling seamless sourcing, customized bidding, regulatory support, and enterprise SaaS integration — all under one digital roof."
  },
  ctaText: {
    type: String,
    required: true,
    default: "LEARN MORE"
  },
  backgroundImage: {
    type: String,
    default: "/images/hero-background.jpg"
  },
  heroImage: {
    type: String,
    default: "/images/fighter-jet.jpg"
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Header/Navigation Schema
const headerSchema = new mongoose.Schema({
  logo: {
    type: String,
    default: "/images/defence-cart-logo.png"
  },
  companyName: {
    type: String,
    default: "DEFENCE CART"
  },
  navigationItems: [{
    label: { type: String, required: true },
    href: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  }],
  contactInfo: {
    phone: {
      type: String,
      default: "8888 444 555"
    },
    email: {
      type: String,
      default: "CONTACT US"
    }
  },
  authButtons: {
    loginText: {
      type: String,
      default: "LOGIN"
    },
    registerText: {
      type: String,
      default: "REGISTER NOW"
    }
  },
  searchPlaceholder: {
    type: String,
    default: "Search"
  },
  bidNowText: {
    type: String,
    default: "BID NOW"
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Features Section Schema (Why Defence Cart?)
const featuresSectionSchema = new mongoose.Schema({
  sectionTitle: {
    type: String,
    required: true,
    default: "WHY DEFENCE CART?"
  },
  features: [{
    icon: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  }],
  backgroundImage: {
    type: String,
    default: "/images/why-defence-cart-bg.jpg"
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Customize Section Schema
const customizeSectionSchema = new mongoose.Schema({
  sectionTitle: {
    type: String,
    required: true,
    default: "Can't find a product as per requirement?"
  },
  sectionSubtitle: {
    type: String,
    required: true,
    default: "CUSTOMIZE & ADD YOUR REQUIREMENTS"
  },
  sideText: {
    type: String,
    default: "CUSTOMIZE"
  },
  description: {
    type: String,
    required: true
  },
  videoThumbnail: {
    type: String,
    default: "/images/video.png"
  },
  playButtonIcon: {
    type: String,
    default: "/images/play-button.svg"
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Who Can Join Section Schema
const whoCanJoinSchema = new mongoose.Schema({
  sectionTitle: {
    type: String,
    required: true,
    default: "WHO CAN JOIN?"
  },
  sectionSubtitle: {
    type: String,
    required: true,
    default: "MODERNIZE YOUR DEFENCE SUPPLY CHAIN"
  },
  ctaText: {
    type: String,
    default: "JOIN NOW"
  },
  userTypes: [{
    category: { type: String, required: true },
    description: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  }],
  centerImage: {
    type: String,
    default: "/images/fighter-jet.jpg"
  },
  currentSlide: {
    type: String,
    default: "Avionics Embedded Systems"
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Subscription Plans Schema
const subscriptionPlansSchema = new mongoose.Schema({
  sectionTitle: {
    type: String,
    default: "SUBSCRIPTION PLANS"
  },
  plans: [{
    name: { type: String, required: true },
    color: { type: String, default: "#DCB13A" },
    features: [{
      name: { type: String, required: true },
      included: { type: Boolean, required: true }
    }],
    price: {
      amount: { type: Number, default: 0 },
      currency: { type: String, default: "INR" },
      period: { type: String, default: "month" }
    },
    ctaText: {
      type: String,
      default: "Get Started"
    },
    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Footer Schema
const footerSchema = new mongoose.Schema({
  logo: {
    type: String,
    default: "/images/defence-cart-logo.png"
  },
  companyName: {
    type: String,
    default: "DEFENCE CART"
  },
  description: {
    type: String,
    default: "India's first private, mission-ready defence procurement platform designed to simplify, secure, and scale procurement for defence manufacturers."
  },
  quickLinks: [{
    label: { type: String, required: true },
    href: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  }],
  contactInfo: {
    phone: {
      type: String,
      default: "1234 4567 6789"
    },
    email: {
      type: String,
      default: "Email@defencecart.com"
    },
    address: {
      type: String,
      default: "12334 lorem ipsum dolor set ametu, consecuter"
    }
  },
  socialMedia: [{
    platform: { type: String, required: true },
    url: { type: String, required: true },
    icon: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  }],
  copyrightText: {
    type: String,
    default: "DefenceCart 2025 | All Rights Reserved"
  },
  legalLinks: [{
    label: { type: String, required: true },
    href: { type: String, required: true }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// SEO Settings Schema
const seoSettingsSchema = new mongoose.Schema({
  title: {
    type: String,
    default: "Defence Cart - India's First Defence Procurement Platform"
  },
  description: {
    type: String,
    default: "Strategic, secure, and seamless defence procurement platform connecting OEMs, MSMEs, and suppliers with verified buyers."
  },
  keywords: {
    type: String,
    default: "defence procurement, military supplies, defence marketplace, strategic procurement"
  },
  ogImage: {
    type: String,
    default: "/images/og-image.jpg"
  },
  favicon: {
    type: String,
    default: "/favicon.ico"
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// General Settings Schema
const generalSettingsSchema = new mongoose.Schema({
  siteName: {
    type: String,
    default: "Defence Cart"
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceMessage: {
    type: String,
    default: "We are currently under maintenance. Please check back soon."
  },
  colors: {
    primary: { type: String, default: "#DCB13A" },
    secondary: { type: String, default: "#95A059" },
    accent: { type: String, default: "#E2E2E2" },
    background: { type: String, default: "#000000" },
    border: { type: String, default: "#313131" }
  },
  fonts: {
    primary: { type: String, default: "Roboto" },
    secondary: { type: String, default: "Roboto Condensed" }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create Models
const HeroSection = mongoose.models.HeroSection || mongoose.model('HeroSection', heroSectionSchema);
const Header = mongoose.models.Header || mongoose.model('Header', headerSchema);
const FeaturesSection = mongoose.models.FeaturesSection || mongoose.model('FeaturesSection', featuresSectionSchema);
const CustomizeSection = mongoose.models.CustomizeSection || mongoose.model('CustomizeSection', customizeSectionSchema);
const WhoCanJoin = mongoose.models.WhoCanJoin || mongoose.model('WhoCanJoin', whoCanJoinSchema);
const SubscriptionPlans = mongoose.models.SubscriptionPlans || mongoose.model('SubscriptionPlans', subscriptionPlansSchema);
const Footer = mongoose.models.Footer || mongoose.model('Footer', footerSchema);
const SEOSettings = mongoose.models.SEOSettings || mongoose.model('SEOSettings', seoSettingsSchema);
const GeneralSettings = mongoose.models.GeneralSettings || mongoose.model('GeneralSettings', generalSettingsSchema);

module.exports = {
  HeroSection,
  Header,
  FeaturesSection,
  CustomizeSection,
  WhoCanJoin,
  SubscriptionPlans,
  Footer,
  SEOSettings,
  GeneralSettings
};
