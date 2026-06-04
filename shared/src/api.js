// API Client with Caching, Dynamic Interception, Live NewsAPI proxy, and Offline Capabilities

// Centralized mock database fallback
const mockDb = {
  home: {
    lead: {
      category: 'CLIMATE ACTION',
      title: 'The Great Energy Transition: Cities Embrace Deep Geothermal Networks',
      author: 'Elena Rostova',
      readTime: '6 min read',
      snippet: 'As global surface temperatures rise, urban planners are looking downward. Geothermal energy networks are quietly expanding beneath European capitals, offering constant base-load heating independent of weather patterns or external supply chains.',
      image: '/editorial_lead.png',
      link: '/premium'
    },
    sidebar: [
      { time: '10 MIN AGO', title: 'Parliament convenes emergency session on antitrust regulations.' },
      { time: '42 MIN AGO', title: 'Tech giant rolls out decentralized operating system.' },
      { time: '2 HOURS AGO', title: 'Central bank maintains benchmark interest rates citing stable inflation.' },
      { time: '4 HOURS AGO', title: 'Coastal cities implement adaptive seawall designs ahead of high tides.' }
    ],
    opinions: [
      {
        quote: 'We must treat digital privacy not as a commercial commodity, but as a foundational human right in the modern constitution.',
        author: 'Dr. Aris Vance',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=80'
      },
      {
        quote: 'Architectural minimalism has stripped cities of their character. We need a return to historical ornamental styles.',
        author: 'Maya Lin-Jones',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80'
      },
      {
        quote: 'Economic models based on infinite growth are incompatible with a finite planetary ecosystem. The math is simple.',
        author: 'Prof. Julian Sen',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&fit=crop&q=80'
      }
    ],
    feed: [
      {
        category: 'TECHNOLOGY',
        title: 'The Post-Quantum Cryptography Race: Securing Global Infrastructure',
        author: 'Linus Vance',
        readTime: '8 min read',
        snippet: 'With quantum computers approaching commercial scale, cryptography standard institutes are finalizing algorithms designed to withstand quantum attacks. Here is how organizations are auditing their critical systems.',
        image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&fit=crop&q=80'
      },
      {
        category: 'CULTURE & LIFE',
        title: 'Preserving the Acoustic Heritage of Ancient Amphitheaters',
        author: 'Sofia Rossi',
        readTime: '5 min read',
        snippet: 'Acoustic engineers are using high-density microphones and 3D modeling to document the exact auditory reflection properties of classical ruins before they degrade further from environmental elements.',
        image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&fit=crop&q=80'
      },
      {
        category: 'CHRONICLE+ PREMIUM',
        title: 'Deep Investigation: Inside the Global Supply Networks of Rare Earth Metals',
        author: 'Marcus Kane',
        readTime: '12 min read',
        snippet: 'A six-month investigation reveals the shadow supply chains, environmental toll, and geopolitical leverages controlling the extraction of elements vital for electric motors and advanced computing chips.',
        image: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=600&fit=crop&q=80',
        premium: true
      },
      {
        category: 'MEDICINE',
        title: 'CRISPR Therapeutics Enter Human Clinical Trials for Hereditary Vision Loss',
        author: 'Dr. Sarah Cho',
        readTime: '7 min read',
        snippet: 'Researchers have initiated gene-editing therapy trials aimed at correcting mutations in retina cells, marking a significant milestone in localized in-vivo genetic medicines.',
        image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&fit=crop&q=80'
      }
    ]
  },
  video: [
    {
      id: 'vid-featured',
      badge: 'DOCUMENTARY EXCLUSIVE',
      title: 'The Silent Depths: Mapping the Unseen Ecosystems of the Mariana Trench',
      duration: '24:12',
      image: '/video_cover.png',
      subtitles: [
        { start: 0, end: 3, text: "For centuries, the ocean floor was believed to be an empty void." },
        { start: 4, end: 8, text: "But thousands of meters below the surface, life thrives in pitch darkness." },
        { start: 9, end: 14, text: "Our robotic submarines are now revealing these geothermal vent ecosystems." },
        { start: 15, end: 20, text: "In this exclusive chronicle, we document species never before seen by human eyes." }
      ]
    },
    {
      id: 'vid-1',
      category: 'INVESTIGATION',
      title: 'Inside the Smart Cities: Who Controls the Data Traffic Flow?',
      duration: '12:40',
      views: '120K views',
      time: '2 days ago',
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&fit=crop&q=80'
    },
    {
      id: 'vid-2',
      category: 'CLIMATE',
      title: 'Harnessing the Winds: Scotland\'s Floating Deep Sea Turbines',
      duration: '08:15',
      views: '84K views',
      time: '4 days ago',
      image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=400&fit=crop&q=80'
    },
    {
      id: 'vid-3',
      category: 'SCIENCE',
      title: 'How Synthetic Biology Re-engineers Insulin Production Networks',
      duration: '15:02',
      views: '240K views',
      time: '1 week ago',
      image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&fit=crop&q=80'
    },
    {
      id: 'vid-4',
      category: 'POLITICS',
      title: 'The Geopolitics of Semiconductors: The Struggle for Silicon Valleys',
      duration: '18:50',
      views: '310K views',
      time: '2 weeks ago',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&fit=crop&q=80'
    },
    {
      id: 'vid-5',
      category: 'SPACE',
      title: 'Preparing for Mars: Simulating Red Planet Habitations in Utah',
      duration: '21:10',
      views: '180K views',
      time: '3 weeks ago',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&fit=crop&q=80'
    },
    {
      id: 'vid-6',
      category: 'ARTS',
      title: 'Restoring Masterpieces: The Laser Chemistry Cleaning Techniques',
      duration: '10:45',
      views: '65K views',
      time: '1 month ago',
      image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&fit=crop&q=80'
    }
  ],
  live: {
    timeline: [
      {
        time: '15:42 GMT',
        title: 'Delegates Gather for Plenary Session',
        text: 'Negotiators from all 190 delegation groups are taking their seats in the Grand Hall. The focus of this session will center on resource distributions for developing economies to implement grid modernization programs.',
        critical: 'DEBATE AREA: Carbon pricing thresholds remain the primary sticking point between industrial groups and policy directors.'
      },
      {
        time: '15:15 GMT',
        title: 'Finance Ministers Propose Adjusted Offset Models',
        text: 'A consortium of finance ministers has tabled a revised carbon trading framework. The proposed rules would introduce tighter audits on reforestation credits and establish international regulatory checks.',
        critical: null
      },
      {
        time: '14:30 GMT',
        title: 'Scientific Advisory Panel Delivers Warning Brief',
        text: 'The climate science committee released a consensus report showing global feedback loops are accelerating faster than 2022 models predicted. The panel recommended lowering total emission targets by an additional 12% before the 2030 checkpoint.',
        critical: 'KEY FINDING: Methane release in tundra regions has increased by 4.2% year-over-year.'
      }
    ],
    pendingPool: [
      {
        time: '16:02 GMT',
        title: 'LANDMARK AGREEMENT: 34 Nations Sign Carbon Offset Pact',
        text: 'Breaking news from the delegation offices: A coalition representing major manufacturing hubs and forestry resources has formally signed the draft accord. The agreement establishes legally binding offset ratios and includes a shared enforcement fund.',
        critical: 'BREAKING IMPACT: Global markets are responding rapidly; green index stocks rise 3.8% in early trading.'
      }
    ]
  },
  premium: {
    plans: [
      { id: 'plan-monthly', name: 'MONTHLY ACCESS', price: '$9', period: 'billed monthly' },
      { id: 'plan-annual', name: 'ANNUAL PASS', price: '$79', period: 'billed annually' }
    ],
    article: {
      tag: 'CHRONICLE+ INVESTIGATION',
      title: 'The Shadow Economy of Rare Earth Metal Extraction',
      author: 'Marcus Kane',
      readTime: '12 min read',
      date: 'June 4, 2026',
      publicParagraphs: [
        'Deep within localized tectonic cracks, minor deposits of neodymium, dysprosium, and yttrium lie embedded in rock grids. Though designated as "rare," these metals are abundant in the earth\'s crust, yet their concentration is so sparse that extracting them is an engineering challenge fraught with geopolitical leverages and ecological footprints.',
        'As industrial sectors accelerate their transition toward wind turbines and electric motors, demand has surged by over 400% in under seven years. This investigation reveals the complex supply routes, corporate joint-ventures, and environmental offsets forming the backbone of this green transition.'
      ],
      truncatedParagraphs: [
        'Satellite intelligence and customs audit logs reviewed by The Chronicle show that over 68% of raw concentrates traverse secondary shipping hubs in the Pacific. In these facilities, materials undergo initial solvent extractions, bypassing direct monitoring agreements.',
        'Local water tests conducted near these major processing facilities reveal concentrations of sulfuric acid and radioactive thorium matching patterns of unauthorized leaching basins.'
      ],
      unlockedParagraphs: [
        'Satellite intelligence and customs audit logs reviewed by The Chronicle show that over 68% of raw concentrates traverse secondary shipping hubs in the Pacific. In these facilities, materials undergo initial solvent extractions, bypassing direct monitoring agreements.',
        'Local water tests conducted near these major processing facilities reveal concentrations of sulfuric acid and radioactive thorium matching patterns of unauthorized leaching basins.',
        'Because processing rare earths involves washing raw crushed ore in chemical arrays, it leaves massive tailings of acid-laden sludge. In countries with relaxed monitoring standards, these pools lie exposed to seasonal monsoons, leading to systemic aquifer contamination.',
        'A shifting coalition of automotive manufacturers has pledged to audit their mineral suppliers by 2028. However, due to raw metals being blended in global smelters, tracing the exact origin of a neodymium magnet remains virtually impossible under current tracking grids.',
        'Ultimately, the challenge remains: to achieve a clean energy grid, we must reconcile with the extraction costs of the raw materials that build it.'
      ],
      pullquote: 'The supply chain of renewable infrastructure is built on the very ecological compromises it intends to replace. It is a paradox of modern transition politics.'
    }
  }
};

class ApiClient {
  constructor() {
    this.cacheKeyPrefix = 'chronicle_api_cache_';
    this.ttl = 5 * 60 * 1000;
  }

  getCache(key) {
    const cached = localStorage.getItem(this.cacheKeyPrefix + key);
    if (!cached) return null;

    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < this.ttl) {
        return data;
      }
      localStorage.removeItem(this.cacheKeyPrefix + key);
    } catch (e) {
      console.warn('Error reading API cache:', e);
    }
    return null;
  }

  setCache(key, data) {
    try {
      const payload = { data, timestamp: Date.now() };
      localStorage.setItem(this.cacheKeyPrefix + key, JSON.stringify(payload));
    } catch (e) {
      console.warn('Error writing API cache:', e);
    }
  }

  calculateTimeAgo(publishedAt) {
    if (!publishedAt) return '10 MIN AGO';
    
    const diffMs = Date.now() - new Date(publishedAt).getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    
    if (diffMins < 60) {
      return `${Math.max(1, diffMins)} MIN AGO`;
    }
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'HOUR' : 'HOURS'} AGO`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ${diffDays === 1 ? 'DAY' : 'DAYS'} AGO`;
  }

  async request(url, options = {}) {
    const { signal, skipCache = false } = options;
    const cacheKey = btoa(url).slice(0, 32);

    // If offline, attempt cache retrieval immediately
    if (!navigator.onLine) {
      const cached = this.getCache(cacheKey);
      if (cached) return cached;
    }

    // Intercept mock server URLs
    if (url.startsWith('https://api.chronicle.com/')) {
      // 1. Home initial load
      if (url.includes('/home/initial')) {
        try {
          const raw = await this.fetchWithProxy('/api/news/v2/top-headlines?country=us&pageSize=10', signal);
          if (raw && raw.articles && raw.articles.length >= 8) {
            const articles = raw.articles;
            
            const lead = {
              category: 'TOP HEADLINE',
              title: articles[0].title.split(' - ')[0],
              author: articles[0].author || 'Staff Reporter',
              readTime: `${Math.round(articles[0].title.split(' ').length / 30) + 3} min read`,
              snippet: articles[0].description || 'Click to view the full investigative coverage.',
              image: articles[0].urlToImage || '/editorial_lead.png',
              link: '/premium'
            };

            const sidebar = articles.slice(1, 5).map(art => ({
              time: this.calculateTimeAgo(art.publishedAt),
              title: art.title.split(' - ')[0]
            }));

            const opinions = [
              {
                quote: articles[5].description || articles[5].title,
                author: articles[5].author || 'Dr. Aris Vance',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=80'
              },
              {
                quote: articles[6].description || articles[6].title,
                author: articles[6].author || 'Maya Lin-Jones',
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80'
              },
              {
                quote: articles[7].description || articles[7].title,
                author: articles[7].author || 'Prof. Julian Sen',
                avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&fit=crop&q=80'
              }
            ];

            const homeData = { lead, sidebar, opinions };
            if (!skipCache) this.setCache(cacheKey, homeData);
            return homeData;
          }
        } catch (e) {
          console.warn('[API Client] NewsAPI initial load failed, returning mock fallback:', e);
        }
        return mockDb.home;
      }

      // 2. Home infinite feed scroll
      if (url.includes('/home/articles/')) {
        const idx = parseInt(url.split('/home/articles/')[1], 10);
        try {
          const page = Math.floor(idx / 10) + 1;
          const itemIdx = idx % 10;
          const raw = await this.fetchWithProxy(`/api/news/v2/everything?q=news&language=en&sortBy=publishedAt&pageSize=10&page=${page}`, signal);
          if (raw && raw.articles && raw.articles[itemIdx]) {
            const article = raw.articles[itemIdx];
            const mappedFeedItem = {
              category: 'WORLD NEWS',
              title: article.title.split(' - ')[0],
              author: article.author || 'Staff Reporter',
              readTime: `${Math.round(article.title.split(' ').length / 30) + 3} min read`,
              snippet: article.description || 'Details from the live world coverage update.',
              image: article.urlToImage || 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&fit=crop&q=80',
              premium: idx % 3 === 2
            };
            if (!skipCache) this.setCache(cacheKey, mappedFeedItem);
            return mappedFeedItem;
          }
        } catch (e) {
          console.warn(`[API Client] NewsAPI feed item ${idx} failed, returning mock fallback:`, e);
        }
        
        const fallbackIdx = idx % mockDb.home.feed.length;
        const fallbackArticle = mockDb.home.feed[fallbackIdx];
        return {
          ...fallbackArticle,
          title: `${fallbackArticle.title} (Dispatch #${idx + 1})`
        };
      }

      // 3. Live feed update: science category
      if (url.includes('/live/feed')) {
        const pageMatch = url.match(/[?&]page=(\d+)/);
        const page = pageMatch ? parseInt(pageMatch[1], 10) : 1;
        try {
          const raw = await this.fetchWithProxy(`/api/news/v2/top-headlines?country=us&category=science&pageSize=15&page=${page}`, signal);
          if (raw && raw.articles && raw.articles.length > 0) {
            const articles = raw.articles;
            
            if (page === 1) {
              const timeline = articles.slice(0, 3).map((art, i) => ({
                time: new Date(art.publishedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }),
                title: art.title.split(' - ')[0],
                text: art.description || 'Live science dispatch briefing.',
                critical: i === 0 ? 'CRITICAL ANALYSIS: High urgency policy targets.' : null
              }));

              // Map all remaining articles into an active updates pending pool!
              const pendingPool = articles.slice(3).map((art) => ({
                time: new Date(art.publishedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }),
                title: `BREAKING NEWS: ${art.title.split(' - ')[0]}`,
                text: art.description || art.content || 'Real-time update report incoming.',
                critical: 'UPDATE IMPACT: Broad market response expected.'
              }));

              const liveData = { timeline, pendingPool };
              if (!skipCache) this.setCache(cacheKey, liveData);
              return liveData;
            } else {
              // For page > 1, return older archived updates as a timeline array
              const timeline = articles.map((art) => ({
                time: this.calculateTimeAgo(art.publishedAt),
                title: art.title.split(' - ')[0],
                text: art.description || 'Archived live science dispatch briefing.',
                critical: null
              }));
              if (!skipCache) this.setCache(cacheKey, timeline);
              return timeline;
            }
          }
        } catch (e) {
          console.warn(`[API Client] Live MFE NewsAPI load failed for page ${page}, returning mock fallback:`, e);
        }
        if (page === 1) {
          return mockDb.live;
        } else {
          return [
            {
              time: '12:00 GMT',
              title: `Archived Dispatch: Session Briefing Part ${page}`,
              text: 'Negotiation coordinators presented initial outlines for regional compliance guidelines. Stakeholders discussed administrative timelines and local framework oversight.',
              critical: null
            },
            {
              time: '11:15 GMT',
              title: `Archived Dispatch: Resource Allocation Draft ${page}`,
              text: 'Technical subgroups finished reviewing feasibility study modules. Early figures estimate a requirements threshold change.',
              critical: null
            }
          ];
        }
      }

      // 4. Video List: Query dynamic documentary news
      if (url.includes('/video/list')) {
        const pageMatch = url.match(/[?&]page=(\d+)/);
        const page = pageMatch ? parseInt(pageMatch[1], 10) : 1;
        try {
          const raw = await this.fetchWithProxy(`/api/news/v2/everything?q=documentary&language=en&pageSize=10&page=${page}`, signal);
          if (raw && raw.articles && raw.articles.length > 0) {
            const articles = raw.articles;
            
            // Maintain Mariana Trench Featured documentary (index 0) on page 1 so controller & CC loop works
            const list = [];
            if (page === 1) {
              list.push(mockDb.video[0]);
            }
            
            // Add dynamically resolved dispatches for grid cards
            articles.forEach((art, i) => {
              list.push({
                id: `vid-${page}-${i}`,
                category: art.source.name ? art.source.name.toUpperCase() : 'DISPATCH',
                title: art.title.split(' - ')[0],
                duration: `${Math.floor(Math.random() * 15) + 5}:${Math.floor(Math.random() * 50) + 10}`,
                views: `${Math.floor(Math.random() * 200) + 50}K views`,
                time: this.calculateTimeAgo(art.publishedAt),
                image: art.urlToImage || `https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&fit=crop&q=80`
              });
            });
            
            if (!skipCache) this.setCache(cacheKey, list);
            return list;
          }
        } catch (e) {
          console.warn(`[API Client] Video MFE NewsAPI list load failed for page ${page}, returning mock fallback:`, e);
        }
        if (page === 1) {
          return mockDb.video;
        } else {
          return mockDb.video.slice(1).map((vid, i) => ({
            ...vid,
            id: `vid-${page}-${i}`,
            title: `${vid.title} (Vol. ${page})`
          }));
        }
      }

      // 5. Premium article content resolver
      if (url.includes('/premium/article')) {
        try {
          const raw = await this.fetchWithProxy('/api/news/v2/everything?q=investigation&language=en&pageSize=5', signal);
          if (raw && raw.articles && raw.articles[0]) {
            const art = raw.articles[0];
            const contentLines = art.content ? art.content.split('\n') : [];
            
            const article = {
              tag: 'CHRONICLE+ EXCLUSIVE',
              title: art.title.split(' - ')[0],
              author: art.author || 'Marcus Kane',
              readTime: `${Math.round(art.title.split(' ').length / 30) + 5} min read`,
              date: new Date(art.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
              publicParagraphs: [
                art.description || 'Exclusive deep investigative report.',
                contentLines[0] || 'Satellite intelligence and customs audit logs reviewed by The Chronicle show that concentrate trades undergo complex shipping schedules.'
              ],
              truncatedParagraphs: [
                contentLines[1] || 'Local environmental monitoring systems near processing terminals reveal concentration elevations matching standard leaching behaviors.'
              ],
              unlockedParagraphs: [
                art.description || 'Exclusive deep investigative report.',
                contentLines[0] || 'Satellite intelligence and customs audit logs reviewed by The Chronicle show that concentrate trades undergo complex shipping schedules.',
                contentLines[1] || 'Local environmental monitoring systems near processing terminals reveal concentration elevations matching standard leaching behaviors.',
                contentLines[2] || 'Because refining concentrates involves chemical washing grids, it leaves residual tailing pools. Tracing element components is vital for auditing transition channels.',
                'Ultimately, audit authorities conclude that to achieve a fully verified renewable material grid, we must reconcile with raw material extraction channels and trace corporate suppliers.'
              ],
              pullquote: 'The integrity of independent reporting is key to tracing global supply flows. We bring key details into the light.'
            };
            if (!skipCache) this.setCache(cacheKey, article);
            return article;
          }
        } catch (e) {
          console.warn('[API Client] Premium MFE NewsAPI article load failed, returning mock fallback:', e);
        }
        return mockDb.premium.article;
      }

      // 6. Premium other articles list resolver
      if (url.includes('/premium/list')) {
        const pageMatch = url.match(/[?&]page=(\d+)/);
        const page = pageMatch ? parseInt(pageMatch[1], 10) : 1;
        try {
          const raw = await this.fetchWithProxy(`/api/news/v2/everything?q=investigation&language=en&pageSize=6&page=${page}`, signal);
          if (raw && raw.articles && raw.articles.length > 0) {
            const list = raw.articles.map((art, i) => {
              const contentLines = art.content ? art.content.split('\n') : [];
              return {
                category: 'CHRONICLE+ INVESTIGATION',
                title: art.title.split(' - ')[0],
                author: art.author || 'Marcus Kane',
                readTime: `${Math.round(art.title.split(' ').length / 30) + 5} min read`,
                snippet: art.description || 'Details from the premium exclusive investigation update.',
                image: art.urlToImage || 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=600&fit=crop&q=80',
                date: new Date(art.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                tag: 'CHRONICLE+ EXCLUSIVE',
                publicParagraphs: [
                  art.description || 'Exclusive deep investigative report.',
                  contentLines[0] || 'Satellite intelligence and customs audit logs reviewed by The Chronicle show that concentrate trades undergo complex shipping schedules.'
                ],
                truncatedParagraphs: [
                  contentLines[1] || 'Local environmental monitoring systems near processing terminals reveal concentration elevations matching standard leaching behaviors.'
                ],
                unlockedParagraphs: [
                  art.description || 'Exclusive deep investigative report.',
                  contentLines[0] || 'Satellite intelligence and customs audit logs reviewed by The Chronicle show that concentrate trades undergo complex shipping schedules.',
                  contentLines[1] || 'Local environmental monitoring systems near processing terminals reveal concentration elevations matching standard leaching behaviors.',
                  contentLines[2] || 'Because refining concentrates involves chemical washing grids, it leaves residual tailing pools. Tracing element components is vital for auditing transition channels.',
                  'Ultimately, audit authorities conclude that to achieve a fully verified renewable material grid, we must reconcile with raw material extraction channels and trace corporate suppliers.'
                ],
                pullquote: 'The integrity of independent reporting is key to tracing global supply flows. We bring key details into the light.',
                premium: true
              };
            });
            if (!skipCache) this.setCache(cacheKey, list);
            return list;
          }
        } catch (e) {
          console.warn('[API Client] Premium list NewsAPI load failed, returning mock fallback:', e);
        }
        // Fallback: mock articles
        return [
          {
            category: 'CHRONICLE+ PREMIUM',
            title: `The Supply Chains of Hydrogen Fuel Cells (Vol. ${page})`,
            author: 'Marcus Kane',
            readTime: '10 min read',
            snippet: 'An investigation into the raw materials, chemical catalysts, and infrastructure logistics needed to scale hydrogen fuels for heavy transport.',
            image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&fit=crop&q=80',
            date: 'June 4, 2026',
            tag: 'CHRONICLE+ INVESTIGATION',
            publicParagraphs: [
              'An investigation into the raw materials, chemical catalysts, and infrastructure logistics needed to scale hydrogen fuels for heavy transport.',
              'Hydrogen represents a clean combustion channel, yet production systems currently depend heavily on fossil fuels to run extraction networks.'
            ],
            truncatedParagraphs: [
              'Customs audits suggest high volumes of catalyst components traverse transit ports with minimal scrutiny.'
            ],
            unlockedParagraphs: [
              'An investigation into the raw materials, chemical catalysts, and infrastructure logistics needed to scale hydrogen fuels for heavy transport.',
              'Hydrogen represents a clean combustion channel, yet production systems currently depend heavily on fossil fuels to run extraction networks.',
              'Customs audits suggest high volumes of catalyst components traverse transit ports with minimal scrutiny.',
              'Auditing the supply networks is essential to claim full ecological integrity.'
            ],
            pullquote: 'Sustainable energy networks must be verified from source to consumption.',
            premium: true
          },
          {
            category: 'CHRONICLE+ INVESTIGATION',
            title: `Digital Sovereignty: National Data Centers & Border Control (Vol. ${page})`,
            author: 'Elena Rostova',
            readTime: '15 min read',
            snippet: 'How countries are enforcing strict localized storage regulations and auditing subsea routing fibers to monitor incoming foreign queries.',
            image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&fit=crop&q=80',
            date: 'June 4, 2026',
            tag: 'CHRONICLE+ EXCLUSIVE',
            publicParagraphs: [
              'How countries are enforcing strict localized storage regulations and auditing subsea routing fibers to monitor incoming foreign queries.',
              'Data sovereignty has transformed cloud computing landscapes into political borders.'
            ],
            truncatedParagraphs: [
              'Recent compliance standards dictate that financial transactions must remain geographically bounded.'
            ],
            unlockedParagraphs: [
              'How countries are enforcing strict localized storage regulations and auditing subsea routing fibers to monitor incoming foreign queries.',
              'Data sovereignty has transformed cloud computing landscapes into political borders.',
              'Recent compliance standards dictate that financial transactions must remain geographically bounded.',
              'This structural shift splits the internet into regional sovereign jurisdictions.'
            ],
            pullquote: 'Data has borders now. The borderless web is a concept of the past.',
            premium: true
          }
        ];
      }

      // Plans
      if (url.includes('/premium/plans')) {
        return mockDb.premium.plans;
      }
    }

    // Standard client fetching rules
    try {
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const data = await response.json();
      if (!skipCache) this.setCache(cacheKey, data);
      return data;
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      const cached = this.getCache(cacheKey);
      if (cached) return cached;
      throw err;
    }
  }

  // Fetch with proxy rules
  async fetchWithProxy(endpoint, signal) {
    const response = await fetch(endpoint, { signal });
    if (!response.ok) {
      throw new Error(`Proxy fetch failed: ${response.status}`);
    }
    return await response.json();
  }
}

export const apiClient = new ApiClient();
export default apiClient;
