import { Injectable } from '@nestjs/common';

const whatsappLink = (topic = 'SchoolRight school management software') =>
  `https://wa.me/2349157777295?text=${encodeURIComponent(
    `Hello SchoolRight, I would like to learn more about ${topic}. Can we discuss a demo for my school?`,
  )}`;

@Injectable()
export class MarketingContentService {
  getLandingPage = (): string =>
    JSON.stringify({
      navigation: [
        { label: 'Features', href: '#features' },
        { label: 'Why Choose Us', href: '#why-schoolright' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Testimonials', href: '#testimonials' },
        { label: 'Resources', href: '#product-tour' },
      ],
      headerActions: {
        login: { label: 'Login', href: '/login' },
        register: { label: 'Get Started', href: '/register' },
      },
      hero: {
        eyebrow: 'ALL-IN-ONE SCHOOL MANAGEMENT SYSTEM',
        title: 'Run Your School Smarter, Save Time and',
        accentTitle: 'Grow Faster.',
        description:
          'SchoolRight helps school owners and administrators manage students, attendance, fees, results, staff and more — all in one easy-to-use platform.',
        productImage: '/images/dashboard.png',
        productImageAlt: 'SchoolRight school management dashboard',
        mobileImage: '/images/students.png',
        mobileImageAlt: 'SchoolRight mobile school management interface',
        trustBadge: { title: 'Trusted by', value: '500+ Schools' },
        primaryAction: { label: 'Get Started Today', href: '/register' },
        secondaryAction: { label: 'Chat on WhatsApp', href: whatsappLink('a SchoolRight demo') },
        assurances: ['Easy to use', 'Affordable', 'Reliable support'],
      },
      featureSummary: [
        { icon: 'users', title: 'Student Management', description: 'Complete student records and profiles' },
        { icon: 'calendar', title: 'Attendance Tracking', description: 'Fast, accurate and real-time attendance' },
        { icon: 'wallet', title: 'Fees & Payments', description: 'Record payments and generate receipts' },
        { icon: 'chart', title: 'Results & Grading', description: 'Manage exams and generate report cards' },
        { icon: 'users', title: 'Staff Management', description: 'Manage teachers and assign roles' },
        { icon: 'megaphone', title: 'Communication', description: 'Send announcements to parents and students' },
      ],
      problem: {
        eyebrow: 'THE CHALLENGE',
        title: 'Running a school is rewarding, but it comes with real challenges.',
        description: 'Many school owners and administrators still rely on manual processes, spreadsheets or scattered tools.',
        points: [
          'Time-consuming paperwork',
          'Errors in fee records and receipts',
          'Difficulty tracking attendance',
          'Slow result processing',
          'Poor communication with parents',
          'Hard to get a clear overview of the school',
        ],
      },
      solution: {
        eyebrow: 'THE SOLUTION',
        title: 'SchoolRight makes school management simple.',
        description: 'All the tools you need in one powerful, easy-to-use platform built for modern schools.',
        points: [
          'Save hours of administrative work',
          'Keep accurate and organized records',
          'Track attendance in real time',
          'Generate results and report cards easily',
          'Communicate with parents and students',
          'Get a clear overview of your entire school',
        ],
      },
      features: [
        { icon: 'users', title: 'Student Management', description: 'Easily register students, manage profiles, class assignments and track their progress.', image: '/images/students.png', imageAlt: 'SchoolRight student management screen', href: '/students', actionLabel: 'Learn More' },
        { icon: 'calendar', title: 'Attendance Management', description: 'Take attendance quickly, view real-time reports and reduce absenteeism.', image: '/images/dashboard.png', imageAlt: 'SchoolRight attendance management screen', href: '/attendance', actionLabel: 'Learn More' },
        { icon: 'wallet', title: 'Fees & Payments', description: 'Record fees, track payments, generate receipts and monitor outstanding balances.', image: '/images/dashboard.png', imageAlt: 'SchoolRight fees and payments screen', href: '/fees', actionLabel: 'Learn More' },
        { icon: 'chart', title: 'Results & Grading', description: 'Manage exams, input scores and generate professional report cards.', image: '/images/dashboard.png', imageAlt: 'SchoolRight results and grading screen', href: '/results', actionLabel: 'Learn More' },
        { icon: 'users', title: 'Staff Management', description: 'Add staff, assign roles and manage permissions with full control.', image: '/images/dashboard.png', imageAlt: 'SchoolRight staff management screen', href: '/staff', actionLabel: 'Learn More' },
        { icon: 'megaphone', title: 'Communication', description: 'Send announcements, updates and notifications to parents and students.', image: '/images/dashboard.png', imageAlt: 'SchoolRight school communication screen', href: '/communication', actionLabel: 'Learn More' },
      ],
      featuresSection: {
        eyebrow: 'POWERFUL FEATURES',
        title: 'Everything you need to manage your school in one place.',
        description: 'From student registration to results, SchoolRight gives you all the tools to run your school efficiently.',
        actionLabel: 'Explore All Features',
        actionHref: '/login',
      },
      productTour: {
        title: 'See SchoolRight in Action',
        description: 'Take a look at the real interface. Clean, simple and powerful.',
        image: '/images/dashboard.png',
        imageAlt: 'SchoolRight school management dashboard product tour',
        videoUrl: '',
        videoPlaceholderLabel: 'Demo video will be added here.',
        demoLabel: 'Watch 2-min Demo',
        items: [
          { icon: 'chart', title: 'Dashboard Overview', description: 'Get a clear view of your school at a glance.' },
          { icon: 'users', title: 'Student Management', description: 'Complete student records and profiles.' },
          { icon: 'wallet', title: 'Fees & Payments', description: 'Track payments and generate receipts.' },
          { icon: 'chart', title: 'Results & Grading', description: 'Manage exams and report cards.' },
          { icon: 'calendar', title: 'Attendance', description: 'Real-time attendance tracking.' },
          { icon: 'users', title: 'Staff Management', description: 'Manage teachers and staff roles.' },
        ],
      },
      testimonials: [
        { quote: 'SchoolRight has transformed the way we manage our school. The fee management and attendance features are excellent.', name: 'Mrs. Aisha Bello', role: 'School Principal, Ibadan', avatar: '/images/schoolright-icon.png', ratingStars: '★★★★★', ratingLabel: '5 out of 5 stars' },
        { quote: 'The system is very easy to use and the support team is always responsive. It has saved us so much time.', name: 'Mr. Tunde Adeyemi', role: 'School Owner, Lagos', avatar: '/images/schoolright-icon.png', ratingStars: '★★★★★', ratingLabel: '5 out of 5 stars' },
        { quote: 'A complete solution for modern schools. Communication with parents is now so much easier.', name: 'Mrs. Fatima Ibrahim', role: 'Administrator, Abuja', avatar: '/images/schoolright-icon.png', ratingStars: '★★★★★', ratingLabel: '5 out of 5 stars' },
      ],
      testimonialsSection: {
        eyebrow: 'REAL SCHOOLS. REAL RESULTS.',
        title: 'Trusted by school owners and administrators.',
        description: 'See what school owners and administrators are saying about their experience with SchoolRight.',
      },
      metrics: [
        { icon: 'graduation', value: '500+', label: 'Schools trust SchoolRight' },
        { icon: 'users', value: '50,000+', label: 'Students managed' },
        { icon: 'star', value: '99%', label: 'Customer satisfaction' },
        { icon: 'shield', value: '24/7', label: 'Support available' },
      ],
      pricing: {
        eyebrow: 'AFFORDABLE PRICING',
        title: "Choose a plan that fits your school's needs.",
        annualDiscount: 'Save up to 20%',
        monthlyLabel: 'Monthly',
        yearlyLabel: 'Yearly',
        monthlyPeriodLabel: 'month',
        yearlyPeriodLabel: 'year',
        popularLabel: 'Most Popular',
        actionLabel: 'Get Started',
        plans: [
          { name: 'Starter', description: 'Perfect for small schools', monthlyPrice: '₦15,000', yearlyPrice: '₦144,000', features: ['Up to 200 students', 'Core features', 'Email support'], href: '/register', icon: 'building' },
          { name: 'Standard', description: 'Ideal for growing schools', monthlyPrice: '₦25,000', yearlyPrice: '₦240,000', features: ['Up to 500 students', 'All core features', 'Priority support', 'Parent communication'], href: '/register', icon: 'building', popular: true },
          { name: 'Premium', description: 'For large schools', monthlyPrice: '₦50,000', yearlyPrice: '₦480,000', features: ['Unlimited students', 'All features', 'Dedicated support', 'Custom setup assistance'], href: '/register', icon: 'building' },
        ],
      },
      faqsSection: {
        eyebrow: 'FREQUENTLY ASKED QUESTIONS',
        title: 'Got questions? We’ve got answers.',
        description: 'Find answers to common questions about SchoolRight.',
        actionLabel: 'View All FAQs',
        actionHref: '#faqs',
      },
      faqs: [
        { question: 'Is there a free trial?', answer: 'Contact the SchoolRight team to discuss access and setup for your school.' },
        { question: 'Can I import my existing data?', answer: 'The team can discuss your existing records and the available onboarding options.' },
        { question: 'Do you offer training and support?', answer: 'SchoolRight support is available to help your team get started.' },
        { question: 'Can parents access the system?', answer: 'SchoolRight supports communication with parents. Contact the team to learn about access options.' },
        { question: 'Is SchoolRight suitable for nurseries and primary schools?', answer: 'Talk to the team about your school type and requirements.' },
        { question: 'Can I cancel my subscription anytime?', answer: 'Contact the SchoolRight team for subscription terms.' },
      ],
      closing: {
        title: 'Ready to transform your school?',
        description: 'Join hundreds of schools already using SchoolRight to save time, stay organized and provide a better learning experience.',
        primaryAction: { label: 'Get Started Today', href: '/register' },
        secondaryAction: { label: 'Chat on WhatsApp', href: whatsappLink('a SchoolRight demo') },
      },
      footer: {
        tagline: 'Smarter Schools. Brighter Futures.',
        copyrightText: 'SchoolRight. All rights reserved.',
        columns: [
          { title: 'Product', links: [{ label: 'Features', href: '#features' }, { label: 'Pricing', href: '#pricing' }, { label: 'Demo', href: '#product-tour' }, { label: 'Updates', href: '#product-tour' }] },
          { title: 'Company', links: [{ label: 'About Us', href: '#why-schoolright' }, { label: 'Contact', href: whatsappLink('SchoolRight sales or support') }, { label: 'Privacy Policy', href: whatsappLink('SchoolRight privacy policy') }, { label: 'Terms of Service', href: whatsappLink('SchoolRight terms of service') }] },
          { title: 'Support', links: [{ label: 'Help Center', href: whatsappLink('SchoolRight help and support') }, { label: 'Documentation', href: '#product-tour' }, { label: 'Contact Support', href: whatsappLink('SchoolRight sales or support') }] },
        ],
      },
      copyrightYear: new Date().getFullYear(),
    });
}
