"use client";
import { Component, type ReactNode } from "react";

type Props = {
  /** Shown in place of the children if drawing them throws. */
  fallback: ReactNode;
  /** Change this to try the children again (a fresh load of the list, say). */
  resetKey?: unknown;
  children: ReactNode;
};

/**
 * Keeps one record that cannot be drawn from taking the page with it.
 *
 * The staff pages list records that anyone may have written. A try/catch
 * around building the list does not catch an error thrown while React draws a
 * card (an object where text was expected, say); without a boundary that
 * error replaces the whole page. Wrap each card in one of these and the worst
 * a bad record can do is show the fallback where its card would be.
 */
export default class CardBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("A record could not be displayed:", error);
  }

  componentDidUpdate(previous: Props) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;
    // The fallback is drawn inside a boundary of its own: if it cannot be
    // drawn either, a line of plain text is, and the page still stands.
    return <LastResort>{this.props.fallback}</LastResort>;
  }
}

class LastResort extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("A placeholder could not be displayed either:", error);
  }

  render() {
    return this.state.failed ? (
      <p className="font-nunito text-sm text-amber-950 px-4 py-2">This record could not be displayed.</p>
    ) : (
      this.props.children
    );
  }
}
