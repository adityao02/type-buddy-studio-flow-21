import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const LandingPage = () => {
  const navigate = useNavigate();
  const scrollElementsRef = useRef<HTMLElement[]>([]);

  const handleStartForFree = () => {
    navigate('/dashboard');
  };

  const handleLogin = () => {
    navigate('/dashboard');
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    scrollElementsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const addToRefs = (el: HTMLElement | null) => {
    if (el && !scrollElementsRef.current.includes(el)) {
      scrollElementsRef.current.push(el);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 header-blur border-b border-gray-100 animate-float-in">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-end items-center space-x-4">
          <Button 
            variant="ghost"
            onClick={handleLogin}
            className="text-gray-600 hover:text-gray-900 font-medium hover-scale"
          >
            Log in
          </Button>
          <Button 
            onClick={handleStartForFree}
            className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium hover-lift"
          >
            Start for free
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="space-y-6 mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-normal text-gray-900 leading-tight animate-slide-up">
              Word processors are stuck in the past.
            </h1>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text leading-tight animate-fade-in-delayed">
              We fixed that...
            </h2>
          </div>

          {/* Introducing Section */}
          <div 
            className="mb-20 scroll-fade-in"
            ref={addToRefs}
          >
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-normal text-gray-900 leading-tight mb-6">
              Introducing <span className="font-bold text-gray-900">Wrdo,</span>{" "}
              <span className="font-normal">next gen docs you'll actually enjoy using.</span>
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Wrdo is a powerful yet friendly <span className="font-semibold">writing & design</span> tool 
              to build docs for the <span className="font-semibold">web & print.</span>
            </p>
          </div>

          {/* Features Section */}
          <div className="space-y-32">
            {/* Drag and Drop Section */}
            <div 
              className="text-center scroll-fade-in"
              ref={addToRefs}
            >
              <div className="mb-12">
                {/* Animated cursors */}
                <div className="flex justify-center items-center space-x-6 mb-8">
                  <div className="relative">
                    <div className="w-8 h-8 bg-orange-500 rounded-full animate-bounce-subtle stagger-1 shadow-lg"></div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border border-orange-500"></div>
                  </div>
                  <div className="relative">
                    <div className="w-8 h-8 bg-gray-400 rounded-full animate-bounce-subtle stagger-2 shadow-lg"></div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border border-gray-400"></div>
                  </div>
                </div>

                {/* Enhanced Block Palette */}
                <div className="relative max-w-lg mx-auto">
                  {/* Main blocks grid */}
                  <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-xl hover-lift">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      {[
                        { name: 'Paragraph', icon: '¶', category: 'text' },
                        { name: 'Heading 1', icon: 'H1', category: 'text' },
                        { name: 'Heading 2', icon: 'H2', category: 'text' },
                        { name: 'Heading 3', icon: 'H3', category: 'text' },
                        { name: 'Columns', icon: '⫾', category: 'layout' },
                        { name: 'Text Box', icon: '□', category: 'layout' },
                        { name: 'Blockquote', icon: '"', category: 'text' },
                        { name: 'Bullet List', icon: '•', category: 'lists' }
                      ].map((item, index) => (
                        <div 
                          key={item.name} 
                          className={`group relative bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-orange-300 rounded-lg p-3 transition-all duration-300 cursor-pointer hover-lift animate-float-in stagger-${Math.min(index + 1, 5)}`}
                        >
                          {/* Block icon */}
                          <div className="text-lg font-bold text-gray-600 group-hover:text-orange-500 mb-1 transition-colors duration-200">
                            {item.icon}
                          </div>
                          {/* Block name */}
                          <div className="text-xs text-gray-700 group-hover:text-gray-900 font-medium transition-colors duration-200">
                            {item.name}
                          </div>
                          {/* Hover effect overlay */}
                          <div className="absolute inset-0 bg-orange-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                          {/* Category indicator */}
                          <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                            item.category === 'text' ? 'bg-blue-400' :
                            item.category === 'layout' ? 'bg-green-400' :
                            item.category === 'lists' ? 'bg-purple-400' : 'bg-gray-400'
                          }`}></div>
                        </div>
                      ))}
                    </div>

                    {/* Category filters */}
                    <div className="flex justify-center space-x-6 pt-4 border-t border-gray-100">
                      {[
                        { name: 'text', color: 'blue' },
                        { name: 'layout', color: 'green' },
                        { name: 'lists', color: 'purple' },
                        { name: 'other', color: 'gray' }
                      ].map((category, index) => (
                        <div 
                          key={category.name}
                          className={`group flex items-center space-x-2 px-3 py-2 rounded-full hover:bg-gray-100 cursor-pointer transition-all duration-200 animate-fade-in-delayed stagger-${index + 1}`}
                        >
                          <div className={`w-2 h-2 rounded-full bg-${category.color}-400 group-hover:scale-125 transition-transform duration-200`}></div>
                          <span className="text-sm text-gray-600 group-hover:text-gray-900 font-medium transition-colors duration-200">
                            {category.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Floating action indicators */}
                  <div className="absolute -top-3 -right-3 bg-orange-500 text-white text-xs px-2 py-1 rounded-full animate-bounce-subtle">
                    Drag & Drop
                  </div>
                  <div className="absolute -bottom-3 -left-3 bg-gray-800 text-white text-xs px-2 py-1 rounded-full animate-bounce-subtle stagger-3">
                    Click to Add
                  </div>
                </div>
              </div>

              <h4 className="text-2xl md:text-3xl font-normal text-gray-900 leading-tight max-w-2xl mx-auto">
                No more endless menus. <span className="font-bold text-orange-500">Everything you need</span> to build a doc 
                lives in the toolbar, ready to <span className="font-bold text-orange-500">drag and drop.</span>
              </h4>
            </div>

            {/* Semantic Blocks Section */}
            <div 
              className="text-center scroll-fade-in"
              ref={addToRefs}
            >
              <h4 className="text-2xl md:text-3xl font-normal text-gray-900 leading-tight max-w-2xl mx-auto mb-12">
                Formatting is fiddly and error-prone. Wrdo fixes this. Docs are built by composing semantic blocks, 
                making it easy to <span className="font-bold">design striking layouts.</span>
              </h4>
              
              {/* Enhanced Brutalism Design Example */}
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 max-w-2xl mx-auto shadow-strong hover-lift">
                <div className="space-y-6">
                  {/* Bold Brutalism Header */}
                  <div className="border-l-8 border-black pl-6 animate-slide-up">
                    <h5 className="text-5xl font-black text-gray-900 mb-2 tracking-tight">BRUTAL</h5>
                    <h6 className="text-5xl font-black text-gray-900 tracking-tight">ISM</h6>
                  </div>
                  
                  {/* Concrete-like visual element */}
                  <div className="relative w-full h-40 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 rounded-none shadow-strong transform rotate-1 hover:rotate-0 transition-transform duration-300 animate-scale-in">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 w-8 h-8 bg-black/20 rotate-45"></div>
                    <div className="absolute top-4 right-4 w-6 h-6 bg-white/30 rounded-full"></div>
                  </div>
                  
                  <p className="text-gray-700 italic font-medium text-lg border-l-4 border-gray-400 pl-4 animate-fade-in-delayed">
                    Raw, monumental post-war social idealism.
                  </p>
                  
                  {/* Improved brutalist principles */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { title: 'Material Honesty', icon: '■' },
                      { title: 'Geometric Forms', icon: '▲' },
                      { title: 'Monolithic Mass', icon: '●' },
                      { title: 'Exposed Structure', icon: '◆' }
                    ].map((item, idx) => (
                      <div 
                        key={item.title} 
                        className={`bg-gray-100 p-4 border-l-4 border-black hover:bg-gray-200 transition-colors duration-200 animate-float-in stagger-${idx + 1} hover-scale cursor-pointer`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl font-black text-black">{item.icon}</span>
                          <span className="text-gray-800 font-semibold text-sm">{item.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* CTA Section */}
          <div 
            className="mt-32 text-center scroll-fade-in"
            ref={addToRefs}
          >
            <Button 
              onClick={handleStartForFree}
              className="bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-lg text-lg font-medium hover-lift animate-glow-pulse"
            >
              Start for free
            </Button>
            <p className="mt-4 text-gray-500 animate-fade-in-delayed">
              Join thousands of creators building beautiful docs
            </p>
          </div>
        </div>
      </main>

      {/* Floating background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-100 rounded-full opacity-30 animate-bounce-subtle"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-100 rounded-full opacity-20 animate-bounce-subtle stagger-3"></div>
        <div className="absolute top-3/4 left-1/3 w-32 h-32 bg-purple-100 rounded-full opacity-25 animate-bounce-subtle stagger-5"></div>
      </div>
    </div>
  );
};

export default LandingPage;