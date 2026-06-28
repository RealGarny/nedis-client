import { render, screen } from "@testing-library/react";
import App from "../../../App";

test("App test", async () => {
  render(<App />);
  expect(screen.getByText(/Hello, World!/i)).toBeInTheDocument();
});
