import { useState, useEffect } from 'react';
import { ButtonPrimary } from '../Buttons/ButtonComponents';
import './Gallery.css';

// Array com as palavras que vão alternar
const changingWords = [
  'tecnologia',
  'inovação',
  'qualidade',
  'performance',
  'experiência',
  'conveniência',
  'confiança',
  'excelência'
];

const Gallery = () => {
  // Estado para controlar qual palavra está sendo exibida
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  // useEffect para alternar as palavras a cada 2 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prevIndex) => 
        (prevIndex + 1) % changingWords.length
      );
    }, 2000); // Muda a cada 2 segundos

    return () => clearInterval(interval); // Limpa o interval quando o componente desmonta
  }, []);

  const handleVerOfertas = () => {
    window.location.href = '/produtos?sort=price_asc';
  };

  return (
    <div className="gallery-container">
      <div className='content-gallery'>
        <div className='content-info'>
          <h2>
            Descubra o melhor em{' '}
            <span className="changing-word">
              {changingWords[currentWordIndex]}
            </span>
          </h2>
          
          <p>
            Na TecnoBits, oferecemos produtos de alta qualidade com os melhores preços do mercado. 
            Encontre tudo o que precisa para elevar seu estilo de vida digital.
          </p>

          <ButtonPrimary onClick={handleVerOfertas} $mobile $desktop>
            Ver Ofertas
          </ButtonPrimary>
        </div>

        
      </div>
    </div>
  );
};

export default Gallery;

