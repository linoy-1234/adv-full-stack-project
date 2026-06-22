import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <main className="page unauthorized-page">
      <section className="card">
        <h1>Access denied</h1>
        <p>You do not have permission to view this page.</p>
        <Link to="/login">Back to login</Link>
      </section>
    </main>
  );
};

export default Unauthorized;

//if a user tries to enter a page that is not uthorized 