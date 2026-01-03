/**
 * BilgeGrade - Yapay Zeka Destekli Sınav Değerlendirme Platformu
 * 
 * Ana JavaScript Dosyası
 * Simüle edilmiş AI değerlendirme motorunu, tokenize içerik oluşturma,
 * asenkron işlem akışı ve UI güncellemelerini içerir.
 * 
 * @author BilgeGrade Team
 * @advisor Filiz Varol Gürder
 * @version 2.0
 */

// ==================== GRADING ENGINE CLASS ====================
/**
 * GradingEngine - AI değerlendirme simülasyonunu yöneten ana sınıf
 * 
 * Bu sınıf, gerçek bir AI backend'i simüle eder. Semantik benzerlik
 * hesaplaması, olgusal doğruluk kontrolü ve yapısal analiz yapar.
 */
class GradingEngine {
    /**
     * GradingEngine constructor
     * Başlangıç ayarlarını ve senaryo verilerini yapılandırır
     */
    constructor() {
        // Değerlendirme durumu
        this.isAnalyzing = false;
        this.strictnessLevel = 50;
        this.analysisResults = null;
        
        // Önceden tanımlanmış hatalı cümleler (simülasyon için)
        // Bu, gerçek bir NLP motorunun yerini alır
        this.knownErrors = [
            {
                pattern: /einstein.*buhar\s*makine/i,
                type: 'factual_error',
                severity: 'high',
                correctInfo: 'Buhar makinesini James Watt geliştirmiştir, Einstein değil.',
                concept: 'Öğrenci makinenin önemini anlamış ancak mucidi yanlış bilmiş.'
            },
            {
                pattern: /1905.*buhar|buhar.*1905/i,
                type: 'factual_error',
                severity: 'medium',
                correctInfo: 'Buhar makinesi 1760-1780 yıllarında geliştirilmiştir.',
                concept: 'Tarih yanlış ancak dönem kavramı mevcut.'
            }
        ];
        
        // Semantik eşleşme için anahtar kavramlar
        this.keyConcepts = [
            { term: 'sanayi devrimi', weight: 1.0, category: 'main_topic' },
            { term: 'teknolojik değişim', weight: 0.9, category: 'concept' },
            { term: 'buhar makinesi', weight: 0.95, category: 'key_invention' },
            { term: 'fabrika', weight: 0.8, category: 'result' },
            { term: 'üretim', weight: 0.85, category: 'concept' },
            { term: 'işçi sınıfı', weight: 0.75, category: 'social' },
            { term: 'şehirleşme', weight: 0.7, category: 'social' },
            { term: 'köy', weight: 0.6, category: 'social' },
            { term: 'ekonomi', weight: 0.7, category: 'economic' },
            { term: 'ingiltere', weight: 0.8, category: 'location' },
            { term: 'james watt', weight: 0.95, category: 'key_person' },
            { term: '18. yüzyıl', weight: 0.85, category: 'time_period' },
            { term: 'makine', weight: 0.75, category: 'concept' },
            { term: 'dönüşüm', weight: 0.8, category: 'concept' }
        ];
        
        // Terminal log mesajları (gerçekçi AI işlem simülasyonu)
        this.terminalLogs = [
            { text: 'Initializing BilgeGrade Engine v2.0...', delay: 300, type: 'info' },
            { text: 'Loading NLP Models...', delay: 400, type: 'default' },
            { text: '├── BERT Transformer Model: OK', delay: 200, type: 'success' },
            { text: '├── Semantic Similarity Module: OK', delay: 200, type: 'success' },
            { text: '└── Factual Verification Engine: OK', delay: 200, type: 'success' },
            { text: 'Tokenizing student response...', delay: 500, type: 'default' },
            { text: 'Generating vector embeddings...', delay: 600, type: 'default' },
            { text: 'Computing cosine similarity matrix...', delay: 400, type: 'default' },
            { text: 'Cross-referencing with ideal answer...', delay: 500, type: 'default' },
            { text: 'Applying strictness coefficient: ', delay: 300, type: 'warning' },
            { text: 'Running factual accuracy checks...', delay: 400, type: 'default' },
            { text: 'Analyzing structural integrity...', delay: 300, type: 'default' },
            { text: 'Generating detailed report...', delay: 400, type: 'default' },
            { text: '✓ Analysis complete!', delay: 200, type: 'success' }
        ];
    }
    
    /**
     * Metni cümlelere ayırır ve tokenize eder
     * Her cümle benzersiz bir ID alır
     * 
     * @param {string} text - Tokenize edilecek metin
     * @returns {Array} - Tokenize edilmiş cümle nesneleri dizisi
     */
    tokenizeText(text) {
        if (!text || text.trim() === '') return [];
        
        // Cümleleri ayır (., !, ? karakterlerine göre)
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        
        return sentences.map((sentence, index) => ({
            id: `sent-${index + 1}`,
            index: index,
            text: sentence.trim(),
            status: 'pending', // pending, match, partial, error
            matchScore: 0,
            comments: [],
            relatedConcepts: []
        }));
    }
    
    /**
     * Bir cümlenin semantik eşleşme puanını hesaplar
     * Anahtar kavramların varlığını ve ağırlıklarını değerlendirir
     * 
     * @param {string} sentence - Analiz edilecek cümle
     * @returns {Object} - Eşleşme puanı ve bulunan kavramlar
     */
    calculateSemanticMatch(sentence) {
        const lowerSentence = sentence.toLowerCase();
        let totalWeight = 0;
        let matchedWeight = 0;
        const foundConcepts = [];
        
        this.keyConcepts.forEach(concept => {
            totalWeight += concept.weight;
            if (lowerSentence.includes(concept.term.toLowerCase())) {
                matchedWeight += concept.weight;
                foundConcepts.push(concept);
            }
        });
        
        const score = totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 0;
        return { score, foundConcepts };
    }
    
    /**
     * Cümlede olgusal hata olup olmadığını kontrol eder
     * Önceden tanımlanmış hata kalıplarını kullanır
     * 
     * @param {string} sentence - Kontrol edilecek cümle
     * @returns {Object|null} - Bulunan hata veya null
     */
    checkFactualAccuracy(sentence) {
        for (const error of this.knownErrors) {
            if (error.pattern.test(sentence)) {
                return error;
            }
        }
        return null;
    }
    
    /**
     * Ana analiz fonksiyonu
     * Öğrenci ve ideal cevabı karşılaştırır, puanları hesaplar
     * 
     * @param {string} studentAnswer - Öğrenci cevabı
     * @param {string} idealAnswer - İdeal cevap
     * @param {number} strictness - Sıkılık seviyesi (0-100)
     * @param {string} specialInstructions - Özel talimatlar
     * @returns {Object} - Analiz sonuçları
     */
    analyze(studentAnswer, idealAnswer, strictness, specialInstructions) {
        this.strictnessLevel = strictness;
        
        // Cümleleri tokenize et
        const tokenizedStudent = this.tokenizeText(studentAnswer);
        const tokenizedIdeal = this.tokenizeText(idealAnswer);
        
        // Her cümle için analiz yap
        let totalSemanticScore = 0;
        let totalFactualScore = 100; // Başlangıçta tam puan
        let factualErrors = [];
        
        tokenizedStudent.forEach(sentence => {
            // Semantik eşleşme hesapla
            const semanticResult = this.calculateSemanticMatch(sentence.text);
            sentence.matchScore = semanticResult.score;
            sentence.relatedConcepts = semanticResult.foundConcepts;
            
            // Olgusal doğruluk kontrolü
            const factualError = this.checkFactualAccuracy(sentence.text);
            
            if (factualError) {
                factualErrors.push({
                    sentenceId: sentence.id,
                    error: factualError
                });
                
                // Sıkılık moduna göre cezalandırma
                if (strictness > 60) {
                    // Katı mod - Olgusal hatalar ağır cezalı
                    sentence.status = 'error';
                    totalFactualScore -= factualError.severity === 'high' ? 40 : 25;
                } else if (strictness < 40) {
                    // Cömert mod - Kavramsal anlama öncelikli
                    sentence.status = 'partial';
                    totalFactualScore -= factualError.severity === 'high' ? 15 : 10;
                } else {
                    // Dengeli mod
                    sentence.status = 'partial';
                    totalFactualScore -= factualError.severity === 'high' ? 25 : 15;
                }
                
                sentence.comments.push({
                    type: 'error',
                    text: factualError.correctInfo,
                    conceptNote: factualError.concept
                });
            } else if (sentence.matchScore > 50) {
                sentence.status = 'match';
            } else if (sentence.matchScore > 20) {
                sentence.status = 'partial';
            } else {
                sentence.status = 'pending';
            }
            
            totalSemanticScore += sentence.matchScore;
        });
        
        // Ortalama semantik puan
        const avgSemanticScore = tokenizedStudent.length > 0 
            ? totalSemanticScore / tokenizedStudent.length 
            : 0;
        
        // Yapısal bütünlük puanı (basitleştirilmiş)
        const structuralScore = this.calculateStructuralScore(studentAnswer);
        
        // Genel puan hesaplama (sıkılık seviyesine göre ağırlıklandırma)
        let overallScore;
        if (strictness > 60) {
            // Katı mod: Olgusal doğruluk ağırlıklı
            overallScore = (avgSemanticScore * 0.3) + (totalFactualScore * 0.5) + (structuralScore * 0.2);
        } else if (strictness < 40) {
            // Cömert mod: Semantik anlam ağırlıklı
            overallScore = (avgSemanticScore * 0.6) + (totalFactualScore * 0.2) + (structuralScore * 0.2);
        } else {
            // Dengeli mod
            overallScore = (avgSemanticScore * 0.4) + (totalFactualScore * 0.35) + (structuralScore * 0.25);
        }
        
        // Sonuçları sakla
        this.analysisResults = {
            tokenizedStudent,
            tokenizedIdeal,
            scores: {
                overall: Math.round(Math.min(100, Math.max(0, overallScore))),
                semantic: Math.round(avgSemanticScore),
                factual: Math.round(Math.max(0, totalFactualScore)),
                structural: Math.round(structuralScore)
            },
            factualErrors,
            strictnessLevel: strictness,
            mode: strictness > 60 ? 'strict' : (strictness < 40 ? 'generous' : 'balanced'),
            specialInstructions
        };
        
        return this.analysisResults;
    }
    
    /**
     * Yapısal bütünlük puanını hesaplar
     * Cümle sayısı, kelime çeşitliliği vb. değerlendirir
     * 
     * @param {string} text - Değerlendirilecek metin
     * @returns {number} - Yapısal bütünlük puanı
     */
    calculateStructuralScore(text) {
        if (!text) return 0;
        
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        const words = text.split(/\s+/).filter(w => w.length > 0);
        const uniqueWords = new Set(words.map(w => w.toLowerCase()));
        
        // Faktörler
        const sentenceCount = sentences.length;
        const avgWordsPerSentence = sentenceCount > 0 ? words.length / sentenceCount : 0;
        const vocabularyRichness = words.length > 0 ? uniqueWords.size / words.length : 0;
        
        // Puanlama
        let score = 50; // Başlangıç puanı
        
        // Cümle sayısı (3-10 arası ideal)
        if (sentenceCount >= 3 && sentenceCount <= 10) {
            score += 20;
        } else if (sentenceCount > 0) {
            score += 10;
        }
        
        // Ortalama cümle uzunluğu (10-20 kelime ideal)
        if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20) {
            score += 15;
        } else if (avgWordsPerSentence > 5) {
            score += 8;
        }
        
        // Kelime çeşitliliği
        if (vocabularyRichness > 0.6) {
            score += 15;
        } else if (vocabularyRichness > 0.4) {
            score += 10;
        }
        
        return Math.min(100, score);
    }
    
    /**
     * AI yorumu oluşturur
     * Analiz sonuçlarına göre detaylı açıklama üretir
     * 
     * @returns {string} - AI yorumu
     */
    generateCommentary() {
        if (!this.analysisResults) return '';
        
        const { scores, factualErrors, mode, tokenizedStudent } = this.analysisResults;
        let commentary = '';
        
        // Genel değerlendirme
        if (scores.overall >= 80) {
            commentary += '✓ Genel olarak başarılı bir cevap. ';
        } else if (scores.overall >= 60) {
            commentary += '◐ Ortalama üstü bir performans, ancak bazı eksiklikler mevcut. ';
        } else if (scores.overall >= 40) {
            commentary += '⚠ Temel kavramlar anlaşılmış, ancak önemli hatalar var. ';
        } else {
            commentary += '✗ Cevap yetersiz, konunun tekrar çalışılması gerekiyor. ';
        }
        
        commentary += '\n\n';
        
        // Semantik analiz yorumu
        commentary += `📊 Semantik Eşleşme (%${scores.semantic}): `;
        if (scores.semantic >= 70) {
            commentary += 'Öğrenci ana kavramları doğru bir şekilde ifade etmiş. Terminoloji kullanımı tutarlı.\n\n';
        } else if (scores.semantic >= 40) {
            commentary += 'Bazı anahtar kavramlar mevcut, ancak daha derin bir anlayış gerekiyor.\n\n';
        } else {
            commentary += 'Kavramsal eksiklikler belirgin. Temel terminoloji yetersiz.\n\n';
        }
        
        // Olgusal doğruluk yorumu
        commentary += `✓ Olgusal Doğruluk (%${scores.factual}): `;
        if (factualErrors.length === 0) {
            commentary += 'Tüm olgusal bilgiler doğru.\n\n';
        } else {
            commentary += `${factualErrors.length} adet olgusal hata tespit edildi.\n`;
            factualErrors.forEach((fe, i) => {
                commentary += `   ${i + 1}. ${fe.error.correctInfo}\n`;
                if (mode === 'generous') {
                    commentary += `      💡 Not: ${fe.error.concept}\n`;
                }
            });
            commentary += '\n';
        }
        
        // Mod bazlı açıklama
        if (mode === 'generous') {
            commentary += '🎯 Değerlendirme Modu: CÖMERT\n';
            commentary += 'Bu modda kavramsal anlayış önceliklidir. Küçük olgusal hatalar, öğrencinin genel konsepti kavradığı düşünülerek minimal cezalandırılmıştır. ';
            commentary += 'Öğrenci doğru kavramları yanlış detaylarla ifade etmiş olsa bile, anlam öncelikli değerlendirilmiştir.\n\n';
        } else if (mode === 'strict') {
            commentary += '🎯 Değerlendirme Modu: KATI\n';
            commentary += 'Bu modda olgusal doğruluk kritik öneme sahiptir. Tarih, isim ve teknik detaylardaki hatalar ağır şekilde cezalandırılmıştır. ';
            commentary += 'Akademik doğruluk standardı uygulanmıştır.\n\n';
        } else {
            commentary += '🎯 Değerlendirme Modu: DENGELİ\n';
            commentary += 'Hem kavramsal anlayış hem de olgusal doğruluk eşit ağırlıkta değerlendirilmiştir.\n\n';
        }
        
        // Yapısal bütünlük yorumu
        commentary += `📐 Yapısal Bütünlük (%${scores.structural}): `;
        if (scores.structural >= 80) {
            commentary += 'Metin iyi organize edilmiş, cümle yapısı düzgün, akıcı bir anlatım.';
        } else if (scores.structural >= 60) {
            commentary += 'Kabul edilebilir düzeyde organizasyon, bazı akış problemleri mevcut.';
        } else {
            commentary += 'Metin organizasyonu zayıf, daha düzenli bir ifade gerekiyor.';
        }
        
        return commentary;
    }
}

// ==================== UI CONTROLLER CLASS ====================
/**
 * UIController - Kullanıcı arayüzü etkileşimlerini yöneten sınıf
 */
class UIController {
    constructor(gradingEngine) {
        this.engine = gradingEngine;
        this.elements = {};
        this.init();
    }
    
    /**
     * DOM elementlerini yakala ve event listener'ları ekle
     */
    init() {
        // DOM elementlerini yakala
        this.elements = {
            // Navigation
            navbar: document.getElementById('navbar'),
            navMenu: document.getElementById('nav-menu'),
            navToggle: document.getElementById('nav-toggle'),
            navLinks: document.querySelectorAll('.nav-link'),
            
            // Upload Section
            idealAnswer: document.getElementById('ideal-answer'),
            studentAnswer: document.getElementById('student-answer'),
            idealCharCount: document.getElementById('ideal-char-count'),
            studentCharCount: document.getElementById('student-char-count'),
            
            // Settings
            strictnessSlider: document.getElementById('strictness-slider'),
            strictnessValue: document.getElementById('strictness-value'),
            specialInstructions: document.getElementById('special-instructions'),
            analyzeBtn: document.getElementById('analyze-btn'),
            
            // Workspace
            workspace: document.getElementById('workspace'),
            uploadSection: document.getElementById('upload-section'),
            terminal: document.getElementById('terminal'),
            terminalBody: document.getElementById('terminal-body'),
            
            // Paper Panel
            paperContainer: document.getElementById('paper-container'),
            studentPaper: document.getElementById('student-paper'),
            paperContent: document.getElementById('paper-content'),
            scanningIndicator: document.getElementById('scanning-indicator'),
            
            // Dashboard Panel
            scoreValue: document.getElementById('score-value'),
            scoreProgress: document.getElementById('score-progress'),
            modeBadge: document.getElementById('mode-badge'),
            semanticValue: document.getElementById('semantic-value'),
            semanticProgress: document.getElementById('semantic-progress'),
            factualValue: document.getElementById('factual-value'),
            factualProgress: document.getElementById('factual-progress'),
            structuralValue: document.getElementById('structural-value'),
            structuralProgress: document.getElementById('structural-progress'),
            commentaryContent: document.getElementById('commentary-content'),
            sentenceList: document.getElementById('sentence-list'),
            
            // Actions
            resetBtn: document.getElementById('reset-btn'),
            exportBtn: document.getElementById('export-btn'),
            
            // Contact Form
            contactForm: document.getElementById('contact-form')
        };
        
        this.bindEvents();
        this.addExampleData();
    }
    
    /**
     * Event listener'ları bağla
     */
    bindEvents() {
        // Navigation scroll effect
        window.addEventListener('scroll', () => this.handleScroll());
        
        // Mobile menu toggle
        if (this.elements.navToggle) {
            this.elements.navToggle.addEventListener('click', () => this.toggleMobileMenu());
        }
        
        // Navigation link clicks
        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavClick(e));
        });
        
        // Character counters
        if (this.elements.idealAnswer) {
            this.elements.idealAnswer.addEventListener('input', () => {
                this.elements.idealCharCount.textContent = this.elements.idealAnswer.value.length;
            });
        }
        
        if (this.elements.studentAnswer) {
            this.elements.studentAnswer.addEventListener('input', () => {
                this.elements.studentCharCount.textContent = this.elements.studentAnswer.value.length;
            });
        }
        
        // Strictness slider
        if (this.elements.strictnessSlider) {
            this.elements.strictnessSlider.addEventListener('input', (e) => {
                this.elements.strictnessValue.textContent = e.target.value;
            });
        }
        
        // Analyze button
        if (this.elements.analyzeBtn) {
            this.elements.analyzeBtn.addEventListener('click', () => this.startAnalysis());
        }
        
        // Reset button
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', () => this.resetAnalysis());
        }
        
        // Export button
        if (this.elements.exportBtn) {
            this.elements.exportBtn.addEventListener('click', () => this.exportReport());
        }
        
        // Contact form
        if (this.elements.contactForm) {
            this.elements.contactForm.addEventListener('submit', (e) => this.handleContactSubmit(e));
        }
    }
    
    /**
     * Örnek verileri ekle
     */
    addExampleData() {
        // Örnek ideal cevap
        const exampleIdeal = `Sanayi Devrimi, 18. yüzyılın sonlarında İngiltere'de başlayan ve dünyayı derinden etkileyen büyük bir ekonomik ve teknolojik dönüşümdür. James Watt'ın buhar makinesini geliştirmesi, bu devrimin en önemli kilometre taşlarından biridir. Buhar gücü sayesinde fabrikalar kurulmuş, üretim el işçiliğinden makine üretimine geçmiştir. Bu süreç, toplumsal yapıyı, şehirleşmeyi ve işçi sınıfının oluşumunu derinden etkilemiştir.`;
        
        // Örnek öğrenci cevabı (hatalı)
        const exampleStudent = `Sanayi Devrimi çok büyük bir teknolojik değişimdir ve dünyayı değiştirmiştir. Einstein 1905 yılında buhar makinesini icat etmiş ve bu sayede fabrikalar açılmıştır. İnsanlar köylerden şehirlere taşınmış, işçi sınıfı ortaya çıkmıştır. Makineler sayesinde üretim hızlanmış ve ekonomi büyümüştür.`;
        
        // Örnek özel talimatlar
        const exampleInstructions = `Buhar makinesinin mucidinin doğru yazılması çok önemlidir. Öğrenci James Watt ismini doğru yazdıysa tam puan almalıdır. Tarih hatası küçük bir eksikliktir. Sanayi Devrimi'nin toplumsal etkilerinden bahsedilmesi bonus puan getirebilir.`;
        
        // Placeholder'ları güncelle
        if (this.elements.idealAnswer) {
            this.elements.idealAnswer.placeholder = `Sorunun doğru/ideal cevabını buraya yazın...\n\nÖrnek:\n${exampleIdeal}`;
        }
        
        if (this.elements.studentAnswer) {
            this.elements.studentAnswer.placeholder = `Değerlendirilecek öğrenci cevabını buraya yazın...\n\nÖrnek:\n${exampleStudent}`;
        }
        
        if (this.elements.specialInstructions) {
            this.elements.specialInstructions.placeholder = `AI'ın dikkat etmesi gereken özel durumları buraya yazın...\n\nÖrnek:\n${exampleInstructions}`;
        }
    }
    
    /**
     * Scroll event handler - navbar stilini günceller
     */
    handleScroll() {
        if (window.scrollY > 50) {
            this.elements.navbar.classList.add('scrolled');
        } else {
            this.elements.navbar.classList.remove('scrolled');
        }
        
        // Active section'ı güncelle
        this.updateActiveNavLink();
    }
    
    /**
     * Aktif navigation linkini günceller
     */
    updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id], header[id]');
        const scrollPos = window.scrollY + 100;
        
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            
            if (scrollPos >= top && scrollPos < top + height) {
                this.elements.navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
    
    /**
     * Mobile menu toggle
     */
    toggleMobileMenu() {
        this.elements.navMenu.classList.toggle('active');
    }
    
    /**
     * Navigation link click handler
     */
    handleNavClick(e) {
        // Mobile menüyü kapat
        this.elements.navMenu.classList.remove('active');
    }
    
    /**
     * Ana analiz sürecini başlat
     */
    async startAnalysis() {
        const idealAnswer = this.elements.idealAnswer.value.trim();
        const studentAnswer = this.elements.studentAnswer.value.trim();
        const strictness = parseInt(this.elements.strictnessSlider.value);
        const specialInstructions = this.elements.specialInstructions.value.trim();
        
        // Validasyon
        if (!idealAnswer) {
            alert('Lütfen ideal cevabı girin!');
            return;
        }
        
        if (!studentAnswer) {
            alert('Lütfen öğrenci cevabını girin!');
            return;
        }
        
        // UI'ı güncelle - analiz başladı
        this.setAnalyzing(true);
        
        // Workspace'i göster
        this.elements.workspace.style.display = 'block';
        this.elements.workspace.scrollIntoView({ behavior: 'smooth' });
        
        // Terminal'i temizle
        this.elements.terminalBody.innerHTML = '';
        
        // Terminal loglarını yaz
        await this.printTerminalLogs(strictness);
        
        // Analizi gerçekleştir
        const results = this.engine.analyze(studentAnswer, idealAnswer, strictness, specialInstructions);
        
        // Sonuçları render et
        await this.renderResults(results);
        
        // UI'ı güncelle - analiz bitti
        this.setAnalyzing(false);
    }
    
    /**
     * Analiz durumunu ayarla
     */
    setAnalyzing(isAnalyzing) {
        this.engine.isAnalyzing = isAnalyzing;
        
        if (isAnalyzing) {
            this.elements.analyzeBtn.classList.add('loading');
            this.elements.analyzeBtn.disabled = true;
            this.elements.studentPaper.classList.add('scanning');
            this.elements.scanningIndicator.classList.add('active');
        } else {
            this.elements.analyzeBtn.classList.remove('loading');
            this.elements.analyzeBtn.disabled = false;
            this.elements.studentPaper.classList.remove('scanning');
            this.elements.scanningIndicator.classList.remove('active');
        }
    }
    
    /**
     * Terminal loglarını yavaşça yazdır
     */
    async printTerminalLogs(strictness) {
        for (const log of this.engine.terminalLogs) {
            await this.delay(log.delay);
            
            let text = log.text;
            // Sıkılık değerini ekle
            if (text.includes('strictness coefficient')) {
                text += strictness;
            }
            
            const line = document.createElement('div');
            line.className = 'terminal-line';
            line.innerHTML = `
                <span class="terminal-prompt">$</span>
                <span class="terminal-text ${log.type}">${text}</span>
            `;
            this.elements.terminalBody.appendChild(line);
            
            // Auto-scroll
            this.elements.terminalBody.scrollTop = this.elements.terminalBody.scrollHeight;
        }
    }
    
    /**
     * Analiz sonuçlarını render et
     */
    async renderResults(results) {
        // Öğrenci kağıdını render et
        this.renderStudentPaper(results.tokenizedStudent);
        
        // Puanları animasyonlu göster
        await this.animateScores(results.scores);
        
        // Mod badge'ini güncelle
        this.updateModeBadge(results.mode);
        
        // AI yorumunu typewriter efektiyle yaz
        await this.typewriteCommentary(this.engine.generateCommentary());
        
        // Cümle analizini render et
        this.renderSentenceAnalysis(results.tokenizedStudent);
    }
    
    /**
     * Öğrenci kağıdını tokenize şekilde render et
     */
    renderStudentPaper(tokenizedSentences) {
        this.elements.paperContent.innerHTML = '';
        
        tokenizedSentences.forEach(sentence => {
            const span = document.createElement('span');
            span.className = `sentence ${sentence.status}`;
            span.id = sentence.id;
            span.textContent = sentence.text + ' ';
            span.dataset.sentenceId = sentence.id;
            
            // Hover event - ilgili analiz kartını highlight et
            span.addEventListener('mouseenter', () => {
                const analysisItem = document.querySelector(`.sentence-item[data-sentence-id="${sentence.id}"]`);
                if (analysisItem) {
                    analysisItem.classList.add('highlighted');
                }
            });
            
            span.addEventListener('mouseleave', () => {
                const analysisItem = document.querySelector(`.sentence-item[data-sentence-id="${sentence.id}"]`);
                if (analysisItem) {
                    analysisItem.classList.remove('highlighted');
                }
            });
            
            this.elements.paperContent.appendChild(span);
        });
    }
    
    /**
     * Puanları animasyonlu göster
     */
    async animateScores(scores) {
        // Genel puan
        await this.animateValue(this.elements.scoreValue, 0, scores.overall, 1500);
        
        // Puan çemberi
        const circumference = 2 * Math.PI * 45; // r = 45
        const offset = circumference - (scores.overall / 100) * circumference;
        this.elements.scoreProgress.style.strokeDashoffset = offset;
        
        // Puan rengini ayarla
        if (scores.overall >= 70) {
            this.elements.scoreProgress.style.stroke = 'var(--success)';
        } else if (scores.overall >= 50) {
            this.elements.scoreProgress.style.stroke = 'var(--warning)';
        } else {
            this.elements.scoreProgress.style.stroke = 'var(--danger)';
        }
        
        // Metrik progress barları
        await Promise.all([
            this.animateProgress(this.elements.semanticProgress, scores.semantic, this.elements.semanticValue),
            this.animateProgress(this.elements.factualProgress, scores.factual, this.elements.factualValue),
            this.animateProgress(this.elements.structuralProgress, scores.structural, this.elements.structuralValue)
        ]);
    }
    
    /**
     * Sayı değerini animasyonlu artır
     */
    async animateValue(element, start, end, duration) {
        const startTime = performance.now();
        
        return new Promise(resolve => {
            const update = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.round(start + (end - start) * eased);
                
                element.textContent = current;
                
                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    resolve();
                }
            };
            
            requestAnimationFrame(update);
        });
    }
    
    /**
     * Progress bar'ı animasyonlu doldur
     */
    async animateProgress(progressElement, value, valueElement) {
        return new Promise(resolve => {
            setTimeout(() => {
                progressElement.style.width = `${value}%`;
                valueElement.textContent = `%${value}`;
                resolve();
            }, 100);
        });
    }
    
    /**
     * Mod badge'ini güncelle
     */
    updateModeBadge(mode) {
        this.elements.modeBadge.className = 'mode-badge ' + mode;
        
        switch(mode) {
            case 'generous':
                this.elements.modeBadge.textContent = '🎁 Cömert Mod';
                break;
            case 'strict':
                this.elements.modeBadge.textContent = '⚡ Katı Mod';
                break;
            default:
                this.elements.modeBadge.textContent = '⚖️ Dengeli Mod';
        }
    }
    
    /**
     * Typewriter efektiyle AI yorumunu yaz
     */
    async typewriteCommentary(text) {
        this.elements.commentaryContent.innerHTML = '';
        this.elements.commentaryContent.classList.add('typewriter');
        
        const lines = text.split('\n');
        
        for (const line of lines) {
            if (line.trim() === '') {
                this.elements.commentaryContent.innerHTML += '<br>';
                continue;
            }
            
            const p = document.createElement('p');
            this.elements.commentaryContent.appendChild(p);
            
            for (let i = 0; i < line.length; i++) {
                p.textContent += line[i];
                await this.delay(10); // Her karakter için 10ms bekle
            }
        }
        
        this.elements.commentaryContent.classList.remove('typewriter');
    }
    
    /**
     * Cümle analizini render et
     */
    renderSentenceAnalysis(tokenizedSentences) {
        this.elements.sentenceList.innerHTML = '';
        
        tokenizedSentences.forEach(sentence => {
            const statusLabels = {
                match: 'Eşleşti',
                partial: 'Kısmen',
                error: 'Hata',
                pending: 'Nötr'
            };
            
            const item = document.createElement('div');
            item.className = `sentence-item ${sentence.status}`;
            item.dataset.sentenceId = sentence.id;
            
            item.innerHTML = `
                <div class="sentence-item-header">
                    <span class="sentence-item-id">${sentence.id.toUpperCase()}</span>
                    <span class="sentence-item-status ${sentence.status}">${statusLabels[sentence.status]}</span>
                </div>
                <div class="sentence-item-text">${sentence.text}</div>
                ${sentence.comments.length > 0 ? `
                    <div class="sentence-item-comment">
                        <small>💡 ${sentence.comments[0].text}</small>
                    </div>
                ` : ''}
            `;
            
            // Hover event - öğrenci kağıdındaki cümleyi highlight et
            item.addEventListener('mouseenter', () => {
                const paperSentence = document.getElementById(sentence.id);
                if (paperSentence) {
                    paperSentence.classList.add('highlighted');
                }
            });
            
            item.addEventListener('mouseleave', () => {
                const paperSentence = document.getElementById(sentence.id);
                if (paperSentence) {
                    paperSentence.classList.remove('highlighted');
                }
            });
            
            // Click event - scroll to sentence
            item.addEventListener('click', () => {
                const paperSentence = document.getElementById(sentence.id);
                if (paperSentence) {
                    paperSentence.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
            
            this.elements.sentenceList.appendChild(item);
        });
    }
    
    /**
     * Analizi sıfırla
     */
    resetAnalysis() {
        // Workspace'i gizle
        this.elements.workspace.style.display = 'none';
        
        // Upload section'a scroll
        this.elements.uploadSection.scrollIntoView({ behavior: 'smooth' });
        
        // Sonuçları temizle
        this.elements.paperContent.innerHTML = '';
        this.elements.sentenceList.innerHTML = '';
        this.elements.commentaryContent.innerHTML = '<p class="placeholder-text">Analiz tamamlandığında AI yorumu burada görünecek...</p>';
        this.elements.scoreValue.textContent = '--';
        this.elements.scoreProgress.style.strokeDashoffset = 283;
        
        // Progress barları sıfırla
        this.elements.semanticProgress.style.width = '0%';
        this.elements.factualProgress.style.width = '0%';
        this.elements.structuralProgress.style.width = '0%';
        this.elements.semanticValue.textContent = '--%';
        this.elements.factualValue.textContent = '--%';
        this.elements.structuralValue.textContent = '--%';
        
        // Terminal'i temizle
        this.elements.terminalBody.innerHTML = `
            <div class="terminal-line">
                <span class="terminal-prompt">$</span>
                <span class="terminal-text">Ready for new analysis...</span>
            </div>
        `;
    }
    
    /**
     * Raporu dışa aktar (Simülasyon)
     */
    exportReport() {
        if (!this.engine.analysisResults) {
            alert('Önce bir analiz yapmalısınız!');
            return;
        }
        
        const results = this.engine.analysisResults;
        const commentary = this.engine.generateCommentary();
        
        // Basit metin raporu oluştur
        let report = `
========================================
        BilgeGrade DEĞERLENDIRME RAPORU
========================================

Tarih: ${new Date().toLocaleDateString('tr-TR')}
Saat: ${new Date().toLocaleTimeString('tr-TR')}

----------------------------------------
                PUANLAR
----------------------------------------
Genel Puan: ${results.scores.overall}/100
Semantik Eşleşme: %${results.scores.semantic}
Olgusal Doğruluk: %${results.scores.factual}
Yapısal Bütünlük: %${results.scores.structural}

Değerlendirme Modu: ${results.mode === 'strict' ? 'Katı' : results.mode === 'generous' ? 'Cömert' : 'Dengeli'}

----------------------------------------
            AI YORUMU
----------------------------------------
${commentary}

----------------------------------------
          CÜMLE BAZLI ANALİZ
----------------------------------------
`;
        
        results.tokenizedStudent.forEach(sentence => {
            const statusLabels = {
                match: '✓ Eşleşti',
                partial: '◐ Kısmen',
                error: '✗ Hata',
                pending: '○ Nötr'
            };
            
            report += `
[${sentence.id.toUpperCase()}] ${statusLabels[sentence.status]}
"${sentence.text}"
`;
            if (sentence.comments.length > 0) {
                report += `   → ${sentence.comments[0].text}\n`;
            }
        });
        
        report += `
========================================
   Danışman: Filiz Varol Gürder
   © 2025 BilgeGrade
========================================
`;
        
        // Raporu indir
        const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BilgeGrade_Rapor_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    /**
     * İletişim formu submit handler
     */
    handleContactSubmit(e) {
        e.preventDefault();
        
        // Form verilerini al
        const name = document.getElementById('contact-name').value;
        const email = document.getElementById('contact-email').value;
        const subject = document.getElementById('contact-subject').value;
        const message = document.getElementById('contact-message').value;
        
        // Simüle edilmiş form gönderimi
        console.log('Form submitted:', { name, email, subject, message });
        
        // Başarı mesajı göster
        alert('Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.');
        
        // Formu temizle
        e.target.reset();
    }
    
    /**
     * Yardımcı: Belirli süre bekle
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ==================== PARTICLE ANIMATION ====================
/**
 * Hero bölümü için particle animasyonu
 */
class ParticleAnimation {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        
        this.particles = [];
        this.init();
    }
    
    init() {
        // Basit gradient background kullan (performans için)
        // Gerçek particle sistemi yerine CSS gradient
    }
}

// ==================== INITIALIZATION ====================
/**
 * Sayfa yüklendiğinde uygulamayı başlat
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎓 BilgeGrade v2.0 başlatılıyor...');
    console.log('📚 Danışman: Filiz Varol Gürder');
    
    // Grading Engine'i oluştur
    const gradingEngine = new GradingEngine();
    
    // UI Controller'ı oluştur ve başlat
    const uiController = new UIController(gradingEngine);
    
    // Particle animasyonunu başlat
    new ParticleAnimation('particles');
    
    // Smooth scroll için anchor linklerini yakala
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    console.log('✅ BilgeGrade başarıyla yüklendi!');
});

// ==================== EXPORT FOR DEBUGGING ====================
// Global scope'a ekle (debugging için)
window.AIGrade = {
    version: '2.0',
    advisor: 'Filiz Varol Gürder',
    year: 2025
};
