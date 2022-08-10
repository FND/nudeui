export default class ButtonGroup extends HTMLElement {
	#internals
	#observer

	constructor () {
		super();

		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = `<style>@import "${new URL("style.css", import.meta.url)}";</style><slot></slot>`;

		this.#internals = this.attachInternals?.();

		if (this.#internals) {
			// https://twitter.com/LeonieWatson/status/1545788775644667904
			this.#internals.role = "region";
		}

		this.addEventListener("click", evt => {
			let previousValue = this.value;

			let button = evt.target;

			while (button && button.parentNode !== this) {
				button = button.parentNode;
			}

			if (button) {
				this.value = getValue(button);

				if (previousValue !== this.value) {
					let evt = new InputEvent("input", {bubbles: true});
					this.dispatchEvent(evt);
				}
			}
		});

		this.#observer = new MutationObserver(mutations => {
			mutations = mutations.filter(m => {
				if (m.target === this) {
					return true;
				}
				else if (m.target.parentNode === this) {
					if (m.type === "childList") {
						return true;
					}
					else if (m.oldValue !== m.target.getAttribute("aria-pressed")) {
						return true;
					}
				}

				return false;
			});

			if (mutations.length > 0) {
				this.value = getValue(this.pressedButton);
			}
		});
	}

	get name () {
		return this.getAttribute("name");
	}

	set name (value) {
		this.setAttribute("name", value);
	}

	#value;

	get value () {
		return this.#value;
	}

	set value (value) {
		this.#value = value;

		this.#internals?.setFormValue(value);

		for (let button of this.children) {
			if (!button.hasAttribute("type")) {
				button.type = "button";
			}

			let ariaPressed = (getValue(button) === value).toString();

			if (ariaPressed !== button.getAttribute("aria-pressed")) {
				button.setAttribute("aria-pressed", ariaPressed);
			}
		}
	}

	get pressedButtons () {
		return [...this.querySelectorAll(`:scope > [aria-pressed="true"]`)];
	}

	get pressedButton () {
		return this.pressedButtons.at(-1);
	}

	get labels() {
		return this.#internals?.labels;
	}

	connectedCallback () {
		this.value = getValue(this.pressedButton);

		this.#observer.observe(this, {
			attributeFilter: ["aria-pressed"],
			attributeOldValue: true,
			childList: true,
			subtree: true,
		});
	}

	disconnectedCallback () {
		this.#observer.disconnect();
	}

	static get formAssociated() {
		return true;
	}
}

function getValue(button) {
	if (!button) {
		return null;
	}

	if (button.hasAttribute("value")) {
		return button.value;
	}
	else {
		return button.textContent.trim();
	}
}

customElements.define("button-group", ButtonGroup);
