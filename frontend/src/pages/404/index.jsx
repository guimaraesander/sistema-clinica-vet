import { Link } from "react-router-dom";
import { ButtonPrimary } from "../../components/Buttons/ButtonComponents";

const NotFoundPage = () => {
    return (
        <div style={{ textAlign: "center", margin: '5rem, 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', padding: "50px" }}>
            <h2 style={{fontSize: '2rem', fontWeight: 'bold', }}>404 - Página Não Encontrada</h2>
            <img src="/images/404.png" alt="Página não encontrada" style={{ width: '300px', height: 'auto', alignItems: 'center' }} />
            <p style={{fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center'}}>Desculpe, a página que você está procurando não existe ou foi movida :(</p>
        </div>
    )
}

export default NotFoundPage;