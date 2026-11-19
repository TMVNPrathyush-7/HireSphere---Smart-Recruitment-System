import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  MessageSquare,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Award,
  RotateCcw,
  BookOpen,
  AlertCircle,
  Lightbulb,
  Check,
  TrendingUp,
  Loader2,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  ShieldCheck,
  Eye,
  Radio,
  Send,
  User,
  Bot,
  Clock,
  Layers,
  ChevronRight,
  Trash2,
  Building
} from 'lucide-react';

const POPULAR_COMPANIES = [
  { name: 'General Tech', icon: '🌐', tagline: 'Core Systems Architecture' },
  { name: 'Google Cloud', icon: '☁️', tagline: '50k+ req/sec Scale' },
  { name: 'Microsoft', icon: '🪟', tagline: 'Enterprise Azure & Scale' },
  { name: 'Amazon AWS', icon: '📦', tagline: 'Multi-Region Partitions' },
  { name: 'Uber', icon: '🚗', tagline: 'Real-Time Geo-Dispatch' },
  { name: 'Stripe', icon: '💳', tagline: 'Payment Idempotency' },
  { name: 'Netflix', icon: '🎬', tagline: 'Streaming CDNs & Resilience' },
  { name: 'NVIDIA', icon: '⚡', tagline: 'High-Throughput AI Inference' }
];

export function MockInterview() {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const queryCompany = searchParams.get('company');
  const [role, setRole] = useState('Senior Full Stack Engineer');
  const [company, setCompany] = useState(queryCompany || 'General Tech');
  const [sessionMode, setSessionMode] = useState('interactive'); // 'interactive' | 'structured'
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [appliedCompanies, setAppliedCompanies] = useState([]);

  useEffect(() => {
    if (queryCompany) {
      setCompany(queryCompany);
    }
  }, [queryCompany]);

  // Auto-sync companies from candidate's real job applications
  useEffect(() => {
    if (profile?.id) {
      api.applications.getCandidateApplications(profile.id)
        .then((apps) => {
          if (Array.isArray(apps)) {
            const unique = Array.from(new Set(apps.map((a) => a.company_name).filter(Boolean)));
            setAppliedCompanies(unique);
          }
        })
        .catch((err) => console.warn('Could not load candidate applied companies:', err));
    }
  }, [profile]);

  // --- Structured Mode States ---
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showAnswer, setShowAnswer] = useState({});
  const [evaluationResults, setEvaluationResults] = useState({});
  const [evaluating, setEvaluating] = useState(false);

  // --- Interactive Live Round States ---
  const [interactiveTurn, setInteractiveTurn] = useState(1); // 1, 2, 3 (turns), 4 = debrief
  const [interactiveHistory, setInteractiveHistory] = useState([]); // [{ speaker, text, time, feedbackSnippet }]
  const [currentAlexPrompt, setCurrentAlexPrompt] = useState('');
  const [currentAlexFeedback, setCurrentAlexFeedback] = useState('');
  const [candidateInput, setCandidateInput] = useState('');
  const [isWaitingForAlex, setIsWaitingForAlex] = useState(false);
  const [finalScorecard, setFinalScorecard] = useState(null);
  const [isAlexSpeaking, setIsAlexSpeaking] = useState(false);
  const [voiceAutoPlay, setVoiceAutoPlay] = useState(true);

  // --- Webcam / Proctor State ---
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // --- Voice Input (Speech-to-Text) State ---
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef(null);

  // --- Voice Output (Text-to-Speech) State for Structured Mode ---
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Refs to prevent React stale closure bugs during continuous speech recognition
  const candidateInputRef = useRef(candidateInput);
  const userAnswersRef = useRef(userAnswers);
  const currentIndexRef = useRef(currentIndex);
  const sessionModeRef = useRef(sessionMode);

  useEffect(() => {
    candidateInputRef.current = candidateInput;
  }, [candidateInput]);

  useEffect(() => {
    userAnswersRef.current = userAnswers;
  }, [userAnswers]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    sessionModeRef.current = sessionMode;
  }, [sessionMode]);

  // Check speech recognition capability on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Cleanup all media streams, speech synthesis, and recognition on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      stopListening();
    };
  }, []);

  // Manage webcam stream when cameraActive or started changes
  useEffect(() => {
    let active = true;

    if (started && cameraActive) {
      setCameraError(null);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false
        })
          .then((stream) => {
            if (!active) {
              stream.getTracks().forEach((track) => track.stop());
              return;
            }
            streamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play().catch(() => { });
            }
          })
          .catch((err) => {
            console.warn('Webcam permission or device error:', err);
            setCameraError(
              err.name === 'NotAllowedError'
                ? 'Camera access permission was denied. You can continue with text/audio answers.'
                : 'No camera detected or device is currently in use.'
            );
            setCameraActive(false);
          });
      } else {
        setCameraError('Webcam is not supported in this browser environment.');
        setCameraActive(false);
      }
    } else {
      stopCamera();
    }

    return () => {
      active = false;
    };
  }, [started, cameraActive]);

  // Stop TTS & mic dictation when changing question in structured mode
  useEffect(() => {
    if (sessionMode === 'structured') {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);

      if (isListening) {
        stopListening();
      }
    }
  }, [currentIndex]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleCamera = () => {
    setCameraActive((prev) => !prev);
  };

  // --- Helper: Text-to-Speech Audio Readout ---
  const speakText = (text) => {
    if (!('speechSynthesis' in window) || !voiceAutoPlay || !text) return;
    try {
      window.speechSynthesis.cancel();

      setTimeout(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.95;
          utterance.pitch = 1.0;

          const voices = window.speechSynthesis.getVoices();
          const naturalVoice =
            voices.find(
              (v) =>
                v.lang.startsWith('en') &&
                (v.name.includes('Natural') ||
                  v.name.includes('Google') ||
                  v.name.includes('Samantha') ||
                  v.name.includes('David'))
            ) || voices.find((v) => v.lang.startsWith('en'));

          if (naturalVoice) {
            utterance.voice = naturalVoice;
          }

          utterance.onstart = () => setIsAlexSpeaking(true);
          utterance.onend = () => setIsAlexSpeaking(false);
          utterance.onerror = (e) => {
            console.warn('Speech synthesis error:', e);
            setIsAlexSpeaking(false);
          };

          window.speechSynthesis.speak(utterance);
        } catch (err) {
          setIsAlexSpeaking(false);
        }
      }, 70);
    } catch (e) {
      setIsAlexSpeaking(false);
    }
  };

  // --- Speech-to-Text: Stop & Flush Audio Buffers ---
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.abort(); // Immediately cancels & flushes Chrome's recognition buffer
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // --- Speech-to-Text (Mic Dictation) ---
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    // Force flush any old recognition instance before launching fresh
    stopListening();

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      // Always sample current text from the active ref at the exact moment recording begins
      const activeMode = sessionModeRef.current;
      const currentRawText =
        activeMode === 'interactive'
          ? (candidateInputRef.current || '').trim()
          : (userAnswersRef.current[currentIndexRef.current] || '').trim();

      const baseText = currentRawText ? currentRawText + ' ' : '';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript + ' ';
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const combined = (baseText + finalTranscript + interimTranscript).trimStart();
        if (sessionModeRef.current === 'interactive') {
          setCandidateInput(combined);
          candidateInputRef.current = combined;
        } else {
          const idx = currentIndexRef.current;
          setUserAnswers((prev) => ({
            ...prev,
            [idx]: combined
          }));
          userAnswersRef.current = {
            ...userAnswersRef.current,
            [idx]: combined
          };
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone permission was denied. Please allow microphone access in your browser settings.');
        }
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      recognitionRef.current = null;
    }
  };

  // --- Text-to-Speech (Structured Mode Question Readout) ---
  const toggleSpeakQuestion = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech audio readout is not supported by your browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const text = currentQ?.question;
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice =
      voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Samantha') ||
            v.name.includes('David'))
      ) || voices.find((v) => v.lang.startsWith('en'));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // --- Launch Session ---
  const getResumeData = () => {
    const skills = Array.isArray(profile?.skills) ? profile.skills : ['React', 'Node.js', 'PostgreSQL'];
    const parsedResume = profile?.parsed_resume_json || {};
    return {
      headline: profile?.headline || '',
      skills,
      experience: Array.isArray(profile?.work_experience) ? profile.work_experience : [],
      education: Array.isArray(profile?.education) ? profile.education : [],
      projects: Array.isArray(parsedResume.projects)
        ? parsedResume.projects
        : Array.isArray(profile?.projects)
        ? profile.projects
        : [],
      summary: parsedResume.summary || profile?.summary || ''
    };
  };

  const startSession = async () => {
    setLoading(true);
    try {
      const resumeData = getResumeData();
      const skills = resumeData.skills;

      if (sessionMode === 'interactive') {
        // Kick off Interactive Live AI Round grounded in candidate's resume
        const res = await api.ai.interactiveInterviewTurn({
          role,
          company: company || 'General Tech',
          skills,
          turn: 1,
          total_turns: 4,
          resume_data: resumeData,
          history: []
        });

        setInteractiveTurn(1);
        setCurrentAlexPrompt(res.next_question);
        setCurrentAlexFeedback(res.feedback_snippet || '');
        setInteractiveHistory([
          {
            speaker: 'interviewer',
            feedbackSnippet: res.feedback_snippet,
            text: res.next_question,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setFinalScorecard(null);
        setCandidateInput('');
        setStarted(true);
        setCameraActive(true);

        // Auto-read Alex's greeting & opening challenge
        const welcomeSpeech = (res.feedback_snippet ? res.feedback_snippet + ' ' : '') + res.next_question;
        speakText(welcomeSpeech);
      } else {
        // Structured Question Bank
        const res = await api.ai.mockInterviewQuestions(role, skills);
        setQuestions(res.questions || []);
        setCurrentIndex(0);
        setUserAnswers({});
        setShowAnswer({});
        setEvaluationResults({});
        setStarted(true);
        setCameraActive(true);
      }
    } catch (e) {
      alert(e.message || 'Error generating interview session');
    } finally {
      setLoading(false);
    }
  };

  // --- Interactive Mode: Submit Response to Alex ---
  const handleInteractiveSubmit = async () => {
    if (!candidateInput || candidateInput.trim().length < 15) {
      alert('Please formulate a substantive technical response (at least 15 characters). Alex evaluates technical depth, modularity, and trade-offs.');
      return;
    }

    // Stop mic if recording
    if (isListening) {
      stopListening();
    }

    const userText = candidateInput.trim();
    const newHistory = [
      ...interactiveHistory,
      {
        speaker: 'candidate',
        text: userText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];

    setInteractiveHistory(newHistory);
    setCandidateInput('');
    setIsWaitingForAlex(true);

    try {
      const resumeData = getResumeData();
      const skills = resumeData.skills;
      const res = await api.ai.interactiveInterviewTurn({
        role,
        company: company || 'General Tech',
        skills,
        turn: interactiveTurn + 1,
        total_turns: 4,
        resume_data: resumeData,
        history: newHistory.map((h) => ({ speaker: h.speaker, text: h.text }))
      });

      if (res.is_final) {
        setInteractiveTurn(4);
        setFinalScorecard(res.final_evaluation);
        const debriefSnippet =
          res.feedback_snippet ||
          'Thank you for walking me through your architecture and reasoning today. That wraps up our technical deep-dive round!';
        setInteractiveHistory((prev) => [
          ...prev,
          {
            speaker: 'interviewer',
            text: debriefSnippet,
            isFinal: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        speakText(debriefSnippet);
      } else {
        if (res.advance_turn !== false) {
          setInteractiveTurn((prev) => prev + 1);
        }
        setCurrentAlexPrompt(res.next_question);
        setCurrentAlexFeedback(res.feedback_snippet || '');
        setInteractiveHistory((prev) => [
          ...prev,
          {
            speaker: 'interviewer',
            feedbackSnippet: res.feedback_snippet,
            text: res.next_question,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        const nextSpeech = (res.feedback_snippet ? res.feedback_snippet + ' ' : '') + res.next_question;
        speakText(nextSpeech);
      }
    } catch (err) {
      alert(err.message || 'Error communicating with AI interviewer.');
    } finally {
      setIsWaitingForAlex(false);
    }
  };

  // Early Session Wrap Up & Scorecard Generator
  const handleEarlyWrapUp = async () => {
    const candidateAnswers = interactiveHistory.filter((h) => h.speaker === 'candidate');
    if (candidateAnswers.length === 0) {
      setStarted(false);
      stopCamera();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      return;
    }

    const confirmEnd = window.confirm(
      'Conclude your technical round now and generate your AI Scorecard based on answers provided so far?'
    );
    if (!confirmEnd) return;

    setIsWaitingForAlex(true);
    try {
      const resumeData = getResumeData();
      const skills = resumeData.skills;
      const res = await api.ai.interactiveInterviewTurn({
        role,
        company: company || 'General Tech',
        skills,
        turn: 4, // triggers final debrief
        total_turns: 4,
        resume_data: resumeData,
        history: interactiveHistory.map((h) => ({ speaker: h.speaker, text: h.text }))
      });

      if (res.final_evaluation) {
        setFinalScorecard(res.final_evaluation);
        setInteractiveTurn(4);
      } else {
        setStarted(false);
        stopCamera();
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      }
    } catch (e) {
      setStarted(false);
      stopCamera();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } finally {
      setIsWaitingForAlex(false);
    }
  };


  const handleCandidateInputChange = (val) => {
    setCandidateInput(val);
    candidateInputRef.current = val;
    if (!val.trim() && isListening) {
      stopListening();
    }
  };

  const handleClearCandidateInput = () => {
    stopListening();
    setCandidateInput('');
    candidateInputRef.current = '';
  };

  // --- Structured Mode Handlers ---
  const handleAnswerChange = (val) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentIndex]: val
    }));
    userAnswersRef.current = {
      ...userAnswersRef.current,
      [currentIndex]: val
    };
    if (!val.trim() && isListening) {
      stopListening();
    }
  };

  const handleClearStructuredInput = () => {
    stopListening();
    setUserAnswers((prev) => ({
      ...prev,
      [currentIndex]: ''
    }));
    userAnswersRef.current = {
      ...userAnswersRef.current,
      [currentIndex]: ''
    };
  };

  const toggleShowAnswer = (idx) => {
    setShowAnswer({
      ...showAnswer,
      [idx]: !showAnswer[idx]
    });
  };

  const handleEvaluateAnswer = async () => {
    const ans = userAnswers[currentIndex];
    if (!ans || ans.trim().length < 10) {
      alert('Please type or dictate a technical answer first before requesting AI evaluation.');
      return;
    }
    setEvaluating(true);
    try {
      const res = await api.ai.evaluateInterviewAnswer({
        role,
        question: currentQ.question,
        sample_answer: currentQ.sample_answer,
        evaluation_criteria: currentQ.evaluation_criteria,
        user_answer: ans
      });
      setEvaluationResults((prev) => ({
        ...prev,
        [currentIndex]: res
      }));
    } catch (e) {
      alert(e.message || 'Error evaluating answer');
    } finally {
      setEvaluating(false);
    }
  };

  const currentQ = questions[currentIndex];
  const currentEvaluation = evaluationResults[currentIndex];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            AI Mock Interview Simulator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {sessionMode === 'interactive'
              ? 'Conversational technical interview with dynamic follow-up challenges and executive scorecard'
              : 'Self-paced practice simulator with proctored webcam preview, voice dictation, and Gemini AI rubrics'}
          </p>
        </div>

        {started && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {sessionMode === 'interactive' ? 'Live AI Round Active' : 'Practice in Progress'}
            </span>
            <button
              onClick={sessionMode === 'interactive' && !finalScorecard ? handleEarlyWrapUp : () => {
                setStarted(false);
                stopCamera();
                if (window.speechSynthesis) window.speechSynthesis.cancel();
              }}
              className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition font-medium flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> End Session
            </button>
          </div>
        )}
      </div>

      {/* Mobile Experience Notice Banner */}
      <div className="md:hidden bg-indigo-50/90 border border-indigo-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-xs">
          💻
        </div>
        <div className="text-xs text-indigo-950">
          <p className="font-bold text-indigo-900">Desktop Recommended for Proctored Sessions</p>
          <p className="text-indigo-700/90 mt-0.5 leading-relaxed">
            You can review prompts and draft answers on mobile. For proctored webcam feeds, audio synthesis, and continuous speech dictation, opening this simulator on a PC or laptop is recommended.
          </p>
        </div>
      </div>


      {!started ? (
        /* Configuration Screen */
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 mx-auto flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 font-display">Choose Interview Experience</h2>
            <p className="text-xs text-slate-500 mt-1">
              Select your preferred interview style to tailor how AI engages with you.
            </p>
          </div>

          {/* Mode Switcher Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mode 1: Interactive Live AI Round */}
            <div
              onClick={() => setSessionMode('interactive')}
              className={`p-5 rounded-2xl border-2 transition cursor-pointer relative space-y-2.5 ${sessionMode === 'interactive'
                  ? 'border-brand-600 bg-brand-50/40 shadow-md shadow-brand-500/10'
                  : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-brand-100 text-brand-700">
                  <Bot className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
                  Resume-Grounded
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Interactive Live AI Round</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Real conversational round with Alex (Staff Tech Lead). Questions are <strong>tailored to your actual resume projects and experience</strong>, with dynamic follow-ups and zero AI interruptions.
                </p>
              </div>
              <div className="text-[11px] font-semibold text-brand-700 flex items-center gap-1 pt-1">
                <Sparkles className="w-3.5 h-3.5" /> Project Deep-Dive + Executive Scorecard
              </div>
            </div>

            {/* Mode 2: Structured Question Bank */}
            <div
              onClick={() => setSessionMode('structured')}
              className={`p-5 rounded-2xl border-2 transition cursor-pointer relative space-y-2.5 ${sessionMode === 'structured'
                  ? 'border-brand-600 bg-brand-50/40 shadow-md shadow-brand-500/10'
                  : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <BookOpen className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Self-Paced Practice
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Structured Question Bank</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Practice 4 scenario questions at your own speed. Reveal model benchmark answers, compare rubrics, and grade your written technical explanations.
                </p>
              </div>
              <div className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1 pt-1">
                <Award className="w-3.5 h-3.5" /> Benchmark Solutions & AI Rubrics
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Target Position / Role
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. AI Systems Engineer, Full Stack Architect"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Target Company Track (Universal & Tailored)
              </label>
              <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200/70">
                {company && company !== 'General Tech' ? `${company} Track` : 'General Systems Track'}
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Type <strong>any target company name</strong>, or 1-click select from your active job applications below. Alex will tailor system design trade-offs, scaling bottlenecks, and failure scenarios to that company's real engineering domain.
            </p>

            {/* Universal Freeform Company Input */}
            <div className="relative">
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Type ANY company name (e.g. Microsoft, Uber, Netflix, Apple, NVIDIA, Oracle...)"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold text-slate-900 pr-16"
              />
              {company && company !== 'General Tech' && (
                <button
                  type="button"
                  onClick={() => setCompany('General Tech')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-slate-200/80 hover:bg-slate-300 px-2 py-1 rounded transition"
                  title="Reset to General Tech"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Section A: Sync from Real Job Applications */}
            {appliedCompanies.length > 0 && (
              <div className="pt-1 space-y-1.5">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-brand-600" />
                  From your active job applications (1-Click Sync):
                </p>
                <div className="flex flex-wrap gap-2">
                  {appliedCompanies.map((cName) => {
                    const isSelected = company.toLowerCase() === cName.toLowerCase();
                    return (
                      <button
                        key={cName}
                        type="button"
                        onClick={() => setCompany(cName)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                          isSelected
                            ? 'bg-brand-600 text-white border-brand-600 shadow-xs ring-2 ring-brand-500/20'
                            : 'bg-brand-50/70 text-brand-700 border-brand-200/80 hover:bg-brand-100'
                        }`}
                      >
                        <Building className="w-3 h-3" />
                        <span>{cName}</span>
                        <span className={`text-[9px] px-1 py-0.5 rounded uppercase font-black ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-brand-200/60 text-brand-900'
                        }`}>
                          Applied
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section B: Quick Reference Tech Presets */}
            <div className="pt-1 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Popular Reference Engineering Tracks:
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_COMPANIES.map((c) => {
                  const isSelected = company.toLowerCase() === c.name.toLowerCase();
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setCompany(c.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-slate-800/20'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                      }`}
                    >
                      <span>{c.icon}</span>
                      <span className="font-bold">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-2">
            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              Proctored Interview Environment Features:
            </p>
            <ul className="space-y-1.5 text-slate-600 pl-1">
              <li className="flex items-center gap-2">
                <Video className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span><strong>Proctored Video Feed:</strong> Live local camera feed to simulate authentic interview posture.</span>
              </li>
              <li className="flex items-center gap-2">
                <Mic className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span>
                  <strong>Speech-to-Text Dictation:</strong> Speak your answers aloud with real-time transcription
                  <span className="text-[10px] text-slate-400 ml-1.5 font-medium">(Chrome / Edge / Safari)</span>.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span><strong>Voice Question Readout:</strong> Listen to questions and follow-ups read aloud automatically.</span>
              </li>
            </ul>
          </div>

          <button
            onClick={startSession}
            disabled={loading}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Preparing session with AI...
              </>
            ) : (
              <>
                {sessionMode === 'interactive' ? 'Launch Interactive Live Round' : 'Launch Mock Interview'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      ) : sessionMode === 'interactive' ? (
        /* INTERACTIVE LIVE AI ROUND ROOM */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Main Interview Conversation Stream (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Stage Stepper Banner */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg">
                  {interactiveTurn <= 3 ? `Round ${interactiveTurn} of 3` : 'Final Debrief'}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {company && company !== 'General Tech' ? (
                    <span className="font-semibold text-brand-700 mr-1">[{company} Track]</span>
                  ) : null}
                  {interactiveTurn === 1
                    ? 'System Architecture & Data Flow'
                    : interactiveTurn === 2
                      ? 'Scalability & Concurrency Probing'
                      : interactiveTurn === 3
                        ? 'Failure Resilience & Telemetry'
                        : 'Executive Performance Scorecard'}
                </span>
              </div>

              {/* Voice Readout Toggle */}
              <button
                type="button"
                onClick={() => {
                  setVoiceAutoPlay(!voiceAutoPlay);
                  if (voiceAutoPlay && window.speechSynthesis) window.speechSynthesis.cancel();
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${voiceAutoPlay
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                title="Toggle automatic voice readout of interviewer questions"
              >
                {voiceAutoPlay ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                    Interviewer Voice: On
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                    Interviewer Voice: Muted
                  </>
                )}
              </button>
            </div>

            {/* Conversation Dialogue Timeline */}
            <div className="space-y-4">
              {interactiveHistory.map((item, idx) => {
                const isInterviewer = item.speaker === 'interviewer';

                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 animate-in fade-in duration-200 ${isInterviewer ? '' : 'flex-row-reverse'
                      }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${isInterviewer
                          ? 'bg-slate-900 text-amber-300 border border-slate-700'
                          : 'bg-brand-600 text-white'
                        }`}
                    >
                      {isInterviewer ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    {/* Bubble Content */}
                    <div
                      className={`max-w-2xl rounded-3xl p-5 space-y-2 shadow-sm border ${isInterviewer
                          ? 'bg-white border-slate-200/80 text-slate-900 rounded-tl-sm'
                          : 'bg-brand-50/70 border-brand-200/80 text-slate-900 rounded-tr-sm'
                        }`}
                    >
                      <div className="flex items-center justify-between gap-4 text-[11px]">
                        <span className="font-bold text-slate-700">
                          {isInterviewer
                            ? (company && company !== 'General Tech'
                                ? `Alex (Staff Lead • ${company})`
                                : 'Alex (Staff Technical Lead)')
                            : 'You (Candidate)'}
                        </span>
                        <span className="text-slate-400">{item.time}</span>
                      </div>

                      {/* Optional Feedback Remark */}
                      {item.feedbackSnippet && (
                        <div className="p-2.5 bg-indigo-50/80 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-start gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Alex's Observation:</strong> {item.feedbackSnippet}
                          </span>
                        </div>
                      )}

                      <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                        {item.text}
                      </p>

                      {isInterviewer && (
                        <div className="flex items-center justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const fullSpeech = (item.feedbackSnippet ? item.feedbackSnippet + ' ' : '') + item.text;
                              speakText(fullSpeech);
                            }}
                            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50/80 hover:bg-indigo-100 transition"
                            title="Replay Alex's voice prompt"
                          >
                            <Volume2 className="w-3 h-3 text-indigo-600" /> Replay Voice
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Waiting for Alex Typing Indicator */}
              {isWaitingForAlex && (
                <div className="flex items-start gap-3 animate-in fade-in duration-200">
                  <div className="w-9 h-9 rounded-2xl bg-slate-900 text-amber-300 flex items-center justify-center shrink-0 border border-slate-700 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-3xl p-4 text-xs text-slate-500 flex items-center gap-2 rounded-tl-sm shadow-sm">
                    <div className="flex items-center gap-1 px-1">
                      <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"></span>
                    </div>
                    <span>Alex is analyzing your response and formulating the next challenge...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Candidate Response Input Console (Turns 1 - 3) */}
            {interactiveTurn <= 3 && !finalScorecard && (
              <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-brand-600" />
                      Your Response to Alex (Round {interactiveTurn} of 3)
                    </span>
                    {isSpeaking ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Volume2 className="w-3 h-3 text-indigo-600" />
                        <div className="flex items-center gap-0.5 h-3">
                          <span className="w-0.5 bg-indigo-500 rounded-full animate-bounce h-2 [animation-delay:-0.3s]"></span>
                          <span className="w-0.5 bg-indigo-600 rounded-full animate-bounce h-3 [animation-delay:-0.15s]"></span>
                          <span className="w-0.5 bg-indigo-500 rounded-full animate-bounce h-3.5"></span>
                          <span className="w-0.5 bg-indigo-600 rounded-full animate-bounce h-2.5 [animation-delay:-0.2s]"></span>
                          <span className="w-0.5 bg-indigo-500 rounded-full animate-bounce h-1.5 [animation-delay:-0.35s]"></span>
                        </div>
                        Alex is speaking...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Take your time • Alex won't interrupt
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {candidateInput.trim() && (
                      <button
                        type="button"
                        onClick={handleClearCandidateInput}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition flex items-center gap-1"
                        title="Clear response to start fresh"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear
                      </button>
                    )}

                    {/* Mic Dictation Button */}
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${isListening
                          ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/25 animate-pulse'
                          : speechSupported
                            ? 'bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100'
                            : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                        }`}
                      title={
                        speechSupported
                          ? 'Dictate your response using your microphone'
                          : 'Speech recognition requires Chrome, Edge, or Safari'
                      }
                    >
                      {isListening ? (
                        <>
                          <div className="flex items-center gap-0.5 h-3.5 mr-0.5">
                            <span className="w-1 bg-white rounded-full animate-bounce h-2 [animation-delay:-0.3s]"></span>
                            <span className="w-1 bg-white rounded-full animate-bounce h-3.5 [animation-delay:-0.15s]"></span>
                            <span className="w-1 bg-white rounded-full animate-bounce h-4"></span>
                            <span className="w-1 bg-white rounded-full animate-bounce h-2.5 [animation-delay:-0.2s]"></span>
                            <span className="w-1 bg-white rounded-full animate-bounce h-1.5 [animation-delay:-0.35s]"></span>
                          </div>
                          <span>Listening... (Click to Stop)</span>
                        </>
                      ) : speechSupported ? (
                        <>
                          <Mic className="w-3.5 h-3.5 text-brand-600" />
                          Dictate Answer (Mic)
                        </>
                      ) : (
                        <>
                          <MicOff className="w-3.5 h-3.5 text-amber-600" />
                          Mic (Chrome/Edge Only)
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={5}
                    value={candidateInput}
                    onChange={(e) => handleCandidateInputChange(e.target.value)}
                    placeholder="Type or dictate your technical explanation, component interactions, trade-offs, and metrics here..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 leading-relaxed font-sans transition"
                  />
                  {isListening && (
                    <div className="absolute top-3 right-3 flex items-center gap-2 bg-rose-50/95 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-sm pointer-events-none backdrop-blur-sm">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                      <div className="flex items-center gap-0.5 h-3">
                        <span className="w-1 bg-rose-500 rounded-full animate-bounce h-2 [animation-delay:-0.3s]"></span>
                        <span className="w-1 bg-rose-600 rounded-full animate-bounce h-3 [animation-delay:-0.15s]"></span>
                        <span className="w-1 bg-rose-500 rounded-full animate-bounce h-3.5"></span>
                        <span className="w-1 bg-rose-600 rounded-full animate-bounce h-2.5 [animation-delay:-0.2s]"></span>
                        <span className="w-1 bg-rose-500 rounded-full animate-bounce h-1.5 [animation-delay:-0.35s]"></span>
                      </div>
                      <span>Live Voice Dictation Active...</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between text-[11px] gap-2">
                  <span>
                    {!speechSupported ? (
                      <span className="text-amber-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Firefox restricts browser speech recognition. Type your answer or switch to Chrome/Edge.
                      </span>
                    ) : candidateInput.trim().length > 0 && candidateInput.trim().length < 25 ? (
                      <span className="text-amber-600 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Response is brief. Alex evaluates technical depth, modularity, and trade-offs (~2-3 sentences recommended).
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        Pro-tip: Highlight trade-offs, potential failure points, and component data boundaries.
                      </span>
                    )}
                  </span>
                  <span className={`font-medium ${candidateInput.trim().length > 0 && candidateInput.trim().length < 25 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {candidateInput.split(/\s+/).filter(Boolean).length} words ({candidateInput.trim().length} chars)
                  </span>
                </div>

                {/* Submit to Alex Action */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleInteractiveSubmit}
                    disabled={isWaitingForAlex || !candidateInput.trim() || candidateInput.trim().length < 15}
                    className="px-6 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-brand-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isWaitingForAlex ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting Response...
                      </>
                    ) : (
                      <>
                        Submit Response to Interviewer
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Final Debrief Scorecard (Round 4) */}
            {finalScorecard && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 animate-in fade-in duration-300">
                {/* Scorecard Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-600 text-white flex flex-col items-center justify-center font-black shadow-xs">
                      <span className="text-xl leading-none tabular-nums">{finalScorecard.overall_score}</span>
                      <span className="text-[10px] text-brand-200 uppercase tracking-widest font-normal">/ 10</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        Final Hiring Assessment
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2 mt-0.5">
                        {finalScorecard.rating}
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800">
                          Interview Completed
                        </span>
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setStarted(false);
                      stopCamera();
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Start New Session
                  </button>
                </div>

                {/* Performance Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-brand-600" />
                      Technical Architecture Depth
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {finalScorecard.technical_depth}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                      Communication & Logic Under Pressure
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {finalScorecard.communication}
                    </p>
                  </div>
                </div>

                {/* Strengths */}
                {finalScorecard.key_strengths && finalScorecard.key_strengths.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Demonstrated Technical Strengths:
                    </span>
                    <ul className="space-y-1.5">
                      {finalScorecard.key_strengths.map((str, i) => (
                        <li
                          key={i}
                          className="text-xs text-slate-700 bg-white border border-emerald-100 p-2.5 rounded-xl flex items-start gap-2 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Growth Areas */}
                {finalScorecard.growth_areas && finalScorecard.growth_areas.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      Key Growth & Deep-Dive Recommendations:
                    </span>
                    <ul className="space-y-1.5">
                      {finalScorecard.growth_areas.map((concept, i) => (
                        <li
                          key={i}
                          className="text-xs text-slate-700 bg-white border border-amber-100 p-2.5 rounded-xl flex items-start gap-2 shadow-sm"
                        >
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>{concept}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right Column: Live Proctor & Real-Time Telemetry (4 Cols) */}
          <div className="lg:col-span-4 space-y-5">

            {/* Live Camera Proctor Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${cameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}
                  />
                  <span className="text-xs font-bold tracking-wider uppercase text-slate-200">
                    {cameraActive ? 'AI Proctor Active' : 'Camera Paused'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleCamera}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${cameraActive
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      : 'bg-brand-600 hover:bg-brand-500 text-white'
                    }`}
                  title={cameraActive ? 'Turn off camera' : 'Turn on camera'}
                >
                  {cameraActive ? (
                    <>
                      <VideoOff className="w-3.5 h-3.5" /> Stop
                    </>
                  ) : (
                    <>
                      <Video className="w-3.5 h-3.5" /> Start
                    </>
                  )}
                </button>
              </div>

              {/* Video Feed Window */}
              <div className="relative aspect-video sm:aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                {cameraActive ? (
                  <>
                    <video
                      ref={(el) => {
                        videoRef.current = el;
                        if (el && streamRef.current && el.srcObject !== streamRef.current) {
                          el.srcObject = streamRef.current;
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover -scale-x-100"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 border border-emerald-500/30">
                      <Radio className="w-3 h-3 animate-spin text-emerald-400" />
                      PROCTOR LIVE
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] text-slate-300">
                      Candidate Feed
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                      <Video className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">Camera Inactive</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Enable webcam to simulate an authentic proctored interview
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleCamera}
                      className="text-xs font-bold px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition shadow-md shadow-brand-500/30"
                    >
                      Enable Live Camera
                    </button>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Proctor Integrity Badges */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="bg-slate-800/80 rounded-xl p-2 border border-slate-700/50 flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400">Eye Tracking</div>
                    <div className="font-semibold text-slate-200">{cameraActive ? 'Monitored' : 'Standby'}</div>
                  </div>
                </div>

                <div className="bg-slate-800/80 rounded-xl p-2 border border-slate-700/50 flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400">Voice Channel</div>
                    <div className="font-semibold text-slate-200">{isListening ? 'Recording' : 'Ready'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interviewer Persona Card */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Alex, Staff Technical Lead</h4>
                  <p className="text-[11px] text-slate-500">Autonomous Interviewer Persona</p>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">What Alex is evaluating:</p>
                <ul className="space-y-1 text-slate-500">
                  <li>• System architecture modularity & concurrency</li>
                  <li>• Handling of unexpected network & database partitions</li>
                  <li>• Clear technical trade-off articulation</li>
                </ul>
              </div>
            </div>

            {/* Voice Dictation Status & Hints Card */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-brand-600" /> Voice Dictation
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isListening
                      ? 'bg-rose-100 text-rose-700 animate-pulse'
                      : speechSupported
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                >
                  {isListening ? 'Active Listening' : speechSupported ? 'Idle' : 'Chrome/Edge Only'}
                </span>
              </div>

              {isListening ? (
                <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-3.5 text-center space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-rose-600 font-bold block">Live Audio Waveform Visualizer</span>
                  <div className="flex items-center justify-center gap-1.5 py-1.5">
                    <span className="w-1.5 h-4 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.4s]"></span>
                    <span className="w-1.5 h-6 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                    <span className="w-1.5 h-9 bg-rose-600 rounded-full animate-bounce [animation-delay:-0.1s]"></span>
                    <span className="w-1.5 h-11 bg-rose-600 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-8 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-5 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-3 bg-rose-300 rounded-full animate-bounce [animation-delay:-0.45s]"></span>
                  </div>
                  <p className="text-xs font-semibold text-rose-900">
                    Transcribing your speech in real time...
                  </p>
                  <p className="text-[11px] text-rose-600">
                    Click "Listening... (Click to Stop)" above when finished.
                  </p>
                </div>
              ) : !speechSupported ? (
                <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3.5 space-y-2 text-xs">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    Browser Dictation Notice
                  </div>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    Firefox does not enable the native <code>SpeechRecognition</code> API by default. For hands-free voice dictation, please open in <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>.
                  </p>
                  <p className="text-slate-500 text-[11px] pt-1.5 border-t border-amber-200/50">
                    💡 You can still type your technical response, listen to questions, and run AI evaluations!
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 leading-relaxed">
                  Practice articulating architectural trade-offs verbally. Click <strong>"Dictate Answer"</strong> above to speak freely — your speech is transcribed straight into your response.
                </p>
              )}
            </div>

          </div>

        </div>
      ) : (
        /* STRUCTURED QUESTION BANK ROOM (PRESERVED) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Main Question & Response Column (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Question Progress Bar */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {currentQ?.type} • Difficulty: <strong className="text-slate-800">{currentQ?.difficulty}</strong>
                </span>
              </div>

              {/* Text-to-Speech Readout Button */}
              <button
                type="button"
                onClick={toggleSpeakQuestion}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${isSpeaking
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25 animate-pulse'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                  }`}
                title="Listen to scenario prompt read aloud"
              >
                {isSpeaking ? (
                  <>
                    <div className="flex items-center gap-0.5 h-3 mr-0.5">
                      <span className="w-1 bg-white rounded-full animate-bounce h-2 [animation-delay:-0.3s]"></span>
                      <span className="w-1 bg-white rounded-full animate-bounce h-3.5 [animation-delay:-0.15s]"></span>
                      <span className="w-1 bg-white rounded-full animate-bounce h-4"></span>
                      <span className="w-1 bg-white rounded-full animate-bounce h-2.5 [animation-delay:-0.2s]"></span>
                      <span className="w-1 bg-white rounded-full animate-bounce h-1.5 [animation-delay:-0.35s]"></span>
                    </div>
                    <span>Stop Reading</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" /> Listen to Question
                  </>
                )}
              </button>
            </div>

            {/* Scenario Box */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Scenario Prompt
                  </span>
                  {isSpeaking && (
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                      <div className="flex items-center gap-0.5 h-3">
                        <span className="w-0.5 bg-indigo-600 rounded-full animate-bounce h-2 [animation-delay:-0.3s]"></span>
                        <span className="w-0.5 bg-indigo-600 rounded-full animate-bounce h-3 [animation-delay:-0.15s]"></span>
                        <span className="w-0.5 bg-indigo-600 rounded-full animate-bounce h-3.5"></span>
                        <span className="w-0.5 bg-indigo-600 rounded-full animate-bounce h-2 [animation-delay:-0.2s]"></span>
                        <span className="w-0.5 bg-indigo-600 rounded-full animate-bounce h-1 [animation-delay:-0.35s]"></span>
                      </div>
                      AI Audio Active...
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                  {currentQ?.question}
                </h2>
              </div>

              {/* Answer Input Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Your Response
                  </label>

                  <div className="flex items-center gap-2">
                    {(userAnswers[currentIndex] || '').trim() && (
                      <button
                        type="button"
                        onClick={handleClearStructuredInput}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition flex items-center gap-1"
                        title="Clear response to start fresh"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear
                      </button>
                    )}

                    {/* Voice Dictation (Speech-to-Text) Toggle */}
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${isListening
                          ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/25 animate-pulse'
                          : speechSupported
                            ? 'bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100'
                            : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                        }`}
                      title={
                        speechSupported
                          ? 'Dictate your answer using your microphone'
                          : 'Speech recognition requires Chrome, Edge, or Safari'
                      }
                    >
                      {isListening ? (
                        <>
                          <div className="flex items-center gap-0.5 h-3.5 mr-0.5">
                            <span className="w-1 bg-white rounded-full animate-bounce h-2 [animation-delay:-0.3s]"></span>
                            <span className="w-1 bg-white rounded-full animate-bounce h-3.5 [animation-delay:-0.15s]"></span>
                            <span className="w-1 bg-white rounded-full animate-bounce h-4"></span>
                            <span className="w-1 bg-white rounded-full animate-bounce h-2.5 [animation-delay:-0.2s]"></span>
                            <span className="w-1 bg-white rounded-full animate-bounce h-1.5 [animation-delay:-0.35s]"></span>
                          </div>
                          <span>Listening... (Click to Stop)</span>
                        </>
                      ) : speechSupported ? (
                        <>
                          <Mic className="w-3.5 h-3.5 text-brand-600" />
                          Dictate Answer (Mic)
                        </>
                      ) : (
                        <>
                          <MicOff className="w-3.5 h-3.5 text-amber-600" />
                          Mic (Chrome/Edge Only)
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={6}
                    value={userAnswers[currentIndex] || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder="Type or dictate your structured technical approach, architecture trade-offs, and methodology here..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 leading-relaxed font-sans transition"
                  />
                  {isListening && (
                    <div className="absolute top-3 right-3 flex items-center gap-2 bg-rose-50/95 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-sm pointer-events-none backdrop-blur-sm">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                      <div className="flex items-center gap-0.5 h-3">
                        <span className="w-1 bg-rose-500 rounded-full animate-bounce h-2 [animation-delay:-0.3s]"></span>
                        <span className="w-1 bg-rose-600 rounded-full animate-bounce h-3 [animation-delay:-0.15s]"></span>
                        <span className="w-1 bg-rose-500 rounded-full animate-bounce h-3.5"></span>
                        <span className="w-1 bg-rose-600 rounded-full animate-bounce h-2.5 [animation-delay:-0.2s]"></span>
                        <span className="w-1 bg-rose-500 rounded-full animate-bounce h-1.5 [animation-delay:-0.35s]"></span>
                      </div>
                      <span>Live Voice Dictation Active...</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    {!speechSupported ? (
                      <span className="text-amber-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Firefox restricts browser speech recognition. Type your answer or switch to Chrome/Edge.
                      </span>
                    ) : (
                      'Pro-tip: Structure with context, trade-offs, and metrics.'
                    )}
                  </span>
                  <span>{(userAnswers[currentIndex] || '').split(/\s+/).filter(Boolean).length} words</span>
                </div>
              </div>

              {/* Action Buttons: Evaluate & Model Answer */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleEvaluateAnswer}
                  disabled={evaluating}
                  className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-brand-500/20 disabled:opacity-50"
                >
                  {evaluating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Evaluating with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      Evaluate My Answer with AI
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => toggleShowAnswer(currentIndex)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  {showAnswer[currentIndex] ? 'Hide Model Benchmark' : 'Reveal Model Benchmark & Rubric'}
                </button>
              </div>

              {/* AI Evaluation Result Card */}
              {currentEvaluation && (
                <div className="bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 border border-indigo-200/80 rounded-3xl p-6 space-y-4 shadow-sm animate-in fade-in duration-200">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-base shadow-md shadow-indigo-500/20">
                        {currentEvaluation.score}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                          AI Score Out of 10
                        </span>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide mt-0.5 ${currentEvaluation.score >= 8
                              ? 'bg-emerald-100 text-emerald-800'
                              : currentEvaluation.score >= 6
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                        >
                          {currentEvaluation.rating}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> AI Evaluated Assessment
                    </span>
                  </div>

                  {/* Strengths */}
                  {currentEvaluation.strengths && currentEvaluation.strengths.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Identified Strengths:
                      </span>
                      <ul className="space-y-1.5">
                        {currentEvaluation.strengths.map((str, i) => (
                          <li
                            key={i}
                            className="text-xs text-slate-700 bg-white/80 border border-emerald-100 p-2.5 rounded-xl flex items-start gap-2"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Missing Key Concepts */}
                  {currentEvaluation.missing_key_concepts && currentEvaluation.missing_key_concepts.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        Key Concepts to Deepen:
                      </span>
                      <ul className="space-y-1.5">
                        {currentEvaluation.missing_key_concepts.map((concept, i) => (
                          <li
                            key={i}
                            className="text-xs text-slate-700 bg-white/80 border border-amber-100 p-2.5 rounded-xl flex items-start gap-2"
                          >
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span>{concept}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actionable Feedback */}
                  {currentEvaluation.actionable_feedback && (
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-1">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-brand-600" />
                        Actionable Coaching Advice:
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {currentEvaluation.actionable_feedback}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Sample Answer Box */}
              {showAnswer[currentIndex] && (
                <div className="bg-gradient-to-br from-indigo-50/50 to-brand-50/30 border border-indigo-200/80 rounded-2xl p-5 space-y-3 animate-in fade-in duration-150">
                  <div>
                    <span className="text-xs font-bold text-indigo-900 block mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Model Benchmark Answer:
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/60">
                      {currentQ?.sample_answer}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-indigo-900 block mb-1 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-brand-600" />
                      Evaluation Criteria (What examiners and interviewers look for):
                    </span>
                    <p className="text-xs text-slate-600 italic bg-white/60 p-3 rounded-xl border border-slate-200/40">
                      {currentQ?.evaluation_criteria}
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Stepper */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(currentIndex - 1)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition disabled:opacity-30 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Previous
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex(currentIndex + 1)}
                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-brand-500/20"
                  >
                    Next Question <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Practice Complete!
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Sidebar: Live Proctor Video & Voice Controls (4 Cols) */}
          <div className="lg:col-span-4 space-y-5">

            {/* Live Camera Proctor Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${cameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}
                  />
                  <span className="text-xs font-bold tracking-wider uppercase text-slate-200">
                    {cameraActive ? 'AI Proctor Active' : 'Camera Paused'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleCamera}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${cameraActive
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      : 'bg-brand-600 hover:bg-brand-500 text-white'
                    }`}
                  title={cameraActive ? 'Turn off camera' : 'Turn on camera'}
                >
                  {cameraActive ? (
                    <>
                      <VideoOff className="w-3.5 h-3.5" /> Stop
                    </>
                  ) : (
                    <>
                      <Video className="w-3.5 h-3.5" /> Start
                    </>
                  )}
                </button>
              </div>

              {/* Video Feed Window */}
              <div className="relative aspect-video sm:aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                {cameraActive ? (
                  <>
                    <video
                      ref={(el) => {
                        videoRef.current = el;
                        if (el && streamRef.current && el.srcObject !== streamRef.current) {
                          el.srcObject = streamRef.current;
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover -scale-x-100"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 border border-emerald-500/30">
                      <Radio className="w-3 h-3 animate-spin text-emerald-400" />
                      PROCTOR LIVE
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] text-slate-300">
                      Candidate Feed
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                      <Video className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">Camera Inactive</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Enable webcam to simulate an authentic proctored interview
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleCamera}
                      className="text-xs font-bold px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition shadow-md shadow-brand-500/30"
                    >
                      Enable Live Camera
                    </button>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Proctor Integrity Badges */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="bg-slate-800/80 rounded-xl p-2 border border-slate-700/50 flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400">Eye Tracking</div>
                    <div className="font-semibold text-slate-200">{cameraActive ? 'Monitored' : 'Standby'}</div>
                  </div>
                </div>

                <div className="bg-slate-800/80 rounded-xl p-2 border border-slate-700/50 flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400">Voice Channel</div>
                    <div className="font-semibold text-slate-200">{isListening ? 'Recording' : 'Ready'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Voice Dictation Status & Hints Card */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-brand-600" /> Voice Dictation
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isListening
                      ? 'bg-rose-100 text-rose-700 animate-pulse'
                      : speechSupported
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                >
                  {isListening ? 'Active Listening' : speechSupported ? 'Idle' : 'Chrome/Edge Only'}
                </span>
              </div>

              {isListening ? (
                <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-3.5 text-center space-y-2">
                  <div className="flex items-center justify-center gap-1 py-1">
                    <span className="w-1.5 h-5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-8 bg-rose-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-10 bg-rose-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-6 bg-rose-600 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                    <span className="w-1.5 h-4 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.35s]"></span>
                  </div>
                  <p className="text-xs font-semibold text-rose-900">
                    Transcribing your speech in real time...
                  </p>
                  <p className="text-[11px] text-rose-600">
                    Click "Listening... (Click to Stop)" above your answer when you finish speaking.
                  </p>
                </div>
              ) : !speechSupported ? (
                <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3.5 space-y-2 text-xs">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    Browser Dictation Notice
                  </div>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    Firefox does not enable the native <code>SpeechRecognition</code> API by default. For hands-free voice dictation, please open the platform in <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>.
                  </p>
                  <p className="text-slate-500 text-[11px] pt-1.5 border-t border-amber-200/50">
                    💡 You can still type your technical response here in Firefox, listen to questions, and run AI evaluations!
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 leading-relaxed">
                  Practice articulating architectural trade-offs verbally. Click <strong>"Dictate Answer"</strong> above to speak freely — your speech is transcribed straight into your response.
                </p>
              )}
            </div>

            {/* Question Quick-Jump Stepper */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">
                Session Questions ({questions.length})
              </span>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const hasAnswer = (userAnswers[idx] || '').trim().length > 0;
                  const hasEvaluation = !!evaluationResults[idx];
                  const isCurrent = idx === currentIndex;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`relative py-2.5 rounded-xl font-bold text-xs transition border flex flex-col items-center justify-center gap-1 ${isCurrent
                          ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/25'
                          : hasEvaluation
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                            : hasAnswer
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                      <span>Q{idx + 1}</span>
                      {hasEvaluation ? (
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                      ) : hasAnswer ? (
                        <Check className="w-2.5 h-2.5 text-emerald-500" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
