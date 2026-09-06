import App from "@/app/App";
import { render, screen } from "@testing-library/react";

test("App test", async () => {
  render(<App />);
  expect(screen.getByText(/Hello, World!/i)).toBeInTheDocument();
});
