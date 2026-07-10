import { memo } from 'react';

let toggleTheme = () => {

    let theme = localStorage.getItem("theme") ?? "light";

    theme = theme === "light" ? "dark" : "light";

    localStorage.setItem("theme", theme);

}

let updateTheme = () => {

    let theme = localStorage.getItem("theme") ?? "light";

    if (document.body.classList.contains("dark") && theme == "light") {
        document.body.classList.remove("dark");
    }

    else if (theme=="dark") {
        document.body.classList.add("dark");
    }


};

const ThemeButton = () => {

	return (

        <svg
            className="icon-night"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            onClick={() => { toggleTheme(); updateTheme(); }}
        >
            <circle cx="15" cy="15" r="7" fill="var(--shade-7)" />
            <circle cx="12" cy="12" r="7" fill="var(--shade-0)" />
        </svg>

	)
};

export default memo(ThemeButton);

export { updateTheme, toggleTheme };

