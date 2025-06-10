import { Link } from 'react-router-dom';
import demoImage from '/src/assets/demo.png';
import Layout from './auth/Layout';

// DM Serif Display for headings, Outfit for other text
const LandingPage = () => {
    return (
        <Layout>
            <div className="min-h-screen flex flex-col md:flex-row items-center justify-center p-0 font-sans relative">
              <div className="relative z-10 flex-1 flex flex-col justify-center px-20 py-16 md:py-0">
                <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 text-left md:text-left drop-shadow-lg font-display">
                  RTI<br /> Information<br />Dispersal System
                </h1>
                <br/>
                <Link to="/login">
                  <button className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 text-white font-semibold text-lg shadow-lg hover:from-blue-500 hover:to-blue-600 transition-all font-sans">
                    Go to Login
                  </button>
                </Link>
          
                {/* RTI Key Points */}
                <ul className="mt-10 text-gray-700 text-left space-y-4 text-sm md:text-base max-w-xl">
                  <li>
                    According to the <strong>RTI Act, 2005, </strong> 
                  </li>
                  <li>
                    <strong>🎯Right to Information:</strong> Citizens can access records from government bodies to ensure transparency.
                  </li>
                  <li>
                    <strong>🎯 Time-Bound Replies:</strong> Information must be provided within 30 days; 48 hours if it concerns life or liberty.
                  </li>
                  <li>
                    <strong>🎯 Appeal Rights:</strong> If denied, citizens can appeal to higher authorities and Information Commissions.
                  </li>
                  <li>
                    <strong>🎯 Affordable Access:</strong> RTI applications cost only ₹10; free for BPL citizens.
                  </li>
                  <li>
                    <strong>🎯 Broad Coverage:</strong> Applies to all public authorities and most government-funded bodies.
                  </li>
                </ul>
          
                <p className="mt-12 text-gray-500 text-sm font-sans">@National Informatics Center</p>
              </div>
          
              <div className="relative z-10 flex-1 flex items-center justify-center p-8">
                <img
                  src={demoImage}
                  alt="Admin Panel Preview"
                  className="rounded-3xl shadow-2xl w-full max-w-2xl border-4 border-white"
                />
              </div>
            </div>
        </Layout>
    );
};

export default LandingPage;