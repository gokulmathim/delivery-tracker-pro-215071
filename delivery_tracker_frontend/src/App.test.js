import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders login route content", () => {
  window.history.pushState({}, "Login", "/login");
  render(<App />);
  expect(screen.getByText(/sign in/i)).toBeInTheDocument();
});
