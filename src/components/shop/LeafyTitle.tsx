interface LeafyTitleProps {
  text: string;
  className?: string;
}

const LeafyTitle = ({ text, className = '' }: LeafyTitleProps) => {
  return (
    <div className={`relative ${className}`}>
      <style>{`
        @keyframes leafSway {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
        
        .leafy-text {
          position: relative;
          display: inline-block;
          font-family: 'Playfair Display', serif;
          font-weight: 700;
          color: #ffffff;
          text-shadow: 0 1px 3px rgba(0,0,0,0.25);
          letter-spacing: 0.04em;
        }
        
        .leaf-decoration {
          position: absolute;
          font-size: 0.55em;
          opacity: 0.7;
          animation: leafSway 3s ease-in-out infinite;
        }
        
        .leaf-1 { top: -0.3em; left: 0.2em; animation-delay: 0s; }
        .leaf-2 { top: -0.2em; right: 0.1em; animation-delay: 0.5s; }
        .leaf-3 { bottom: -0.3em; left: 30%; animation-delay: 1s; }
        .leaf-4 { top: 0.1em; left: 50%; animation-delay: 1.5s; transform: rotate(45deg); }
      `}</style>
      
      <span className="leafy-text">
        {text}
        <span className="leaf-decoration leaf-1">🍃</span>
        <span className="leaf-decoration leaf-2">🌿</span>
        <span className="leaf-decoration leaf-3">🍂</span>
        <span className="leaf-decoration leaf-4">🌱</span>
      </span>
    </div>
  );
};

export default LeafyTitle;