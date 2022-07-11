import { noop } from '../utils';

const marginVec2 = { x: -5, y: -5 };
var current = null; // currently dragged item
const cleanupNodes = new Set();

const getClientVec2 = ev => ({
	x: ev.type.startsWith('touch') ? ev.changedTouches[0].clientX : ev.clientX,
	y: ev.type.startsWith('touch') ? ev.changedTouches[0].clientY : ev.clientY
});

const markAboveOrBelow = (targetEl, clientVec2, midpointOffset) => {
	const rect = targetEl.getBoundingClientRect();
	const top = rect.y;
	targetEl.classList.toggle('dnd-target-above', clientVec2.y - top <= (rect.height * 0.5 + midpointOffset))
	targetEl.classList.toggle('dnd-target-below', clientVec2.y - top > (rect.height * 0.5 + midpointOffset))
};


const useDnd = ({ type, data, ref, onPickup = noop, onVerify = () => true, onComplete = noop, onCleanup = noop, midpointOffset = 0, ghostContainerSelector = 'body' }) => {
	if (!type) {
		throw new Error(`Named argument "type" is required for "onDrag'. Got ${type}`);
	}
	const onDrag = ev => {
		const ghostContainer = document.querySelector(ghostContainerSelector);
		const ghost = ref.current.cloneNode(true);
		const rect = ref.current.getBoundingClientRect();
		const clientVec2 = getClientVec2(ev);
		const posVec2 = { x: rect.x + window.scrollX, y: rect.y + window.scrollY };
		const offsetVec2 = { x: posVec2.x - clientVec2.x + marginVec2.x, y: posVec2.y - clientVec2.y + marginVec2.y };
		const body = document.querySelector('body');

		ev.preventDefault();

		body.classList.add('dnd-in-progress');
		body.style.setProperty('--dnd-height', `${rect.height}px`);

		ref.current.classList.add('dnd-src');
		ghost.classList.add('dnd-ghost');
		ghost.style.position = 'absolute'
		ghost.style.top = `0`;
		ghost.style.left = `0`;
		ghost.style.transform = `translate(${clientVec2.x + offsetVec2.x}px, ${clientVec2.y + offsetVec2.y}px`;
		ghost.style.width = `${rect.width}px`;
		ghost.style.height = `${rect.height}px`;
		ghost.style.pointerEvents = 'none';

		ghostContainer.appendChild(ghost);

		if(typeof data === 'function') {
			data = data(ev);
		}

		current = { type, ...data };

		onPickup(ev);

		const handleMouseMove = mmev => {
			const clientVec2 = getClientVec2(mmev);
			ghost.style.transform = `translate(${clientVec2.x + offsetVec2.x}px, ${clientVec2.y + offsetVec2.y}px`;
			mmev.preventDefault();
			mmev.stopPropagation();

			if(mmev.type === 'touchmove') {
				const dndCandidate = document
					.elementFromPoint(clientVec2.x, clientVec2.y)
					?.closest('[data-dnd-candidate]');

				if(dndCandidate) {
					for (const node of cleanupNodes) {
						if (node !== dndCandidate) {
							node.classList.remove('dnd-target-below', 'dnd-target-above', 'dnd-target');
						}
					}

					dndCandidate.classList.add('dnd-target');
					markAboveOrBelow(dndCandidate, clientVec2, midpointOffset);
					cleanupNodes.add(dndCandidate);
				}
			}
		};

		const cleanup = cleanupEv => {
			if(cleanupEv.type === 'touchend') {
				const clientVec2 = getClientVec2(cleanupEv);
				const dndCandidate = document
					.elementFromPoint(clientVec2.x, clientVec2.y)
					?.closest('[data-dnd-candidate]');

				const rect = dndCandidate.getBoundingClientRect();
				const top = rect.y;
				const above = clientVec2.y - top <= rect.height * 0.5 + midpointOffset;

				onComplete(dndCandidate, above, current, ev);
			}

			setTimeout(() => {
				ref.current.classList.remove('dnd-src');
				document.querySelector('body').classList.remove('dnd-in-progress');
				try {
					ghostContainer.removeChild(ghost);
					for (const node of cleanupNodes) {
						node.classList.remove('dnd-target-below', 'dnd-target-above', 'dnd-target');
					}

					cleanupNodes.clear();
					onCleanup(cleanupEv, current);
				} catch(e) {
					//
				}

				ghostContainer.removeEventListener('mousemove', handleMouseMove);
				ghostContainer.removeEventListener('touchmove', handleMouseMove);
				ghostContainer.removeEventListener('mouseup', cleanup);
				ghostContainer.removeEventListener('touchend', cleanup);
				ghostContainer.removeEventListener('touchcancel', cleanup);
				ghostContainer.removeEventListener('mouseleave', cleanup);
				document.querySelector('html').removeEventListener('mouseleave', cleanup);
				current = null;
			}, 0);
		};

		ghostContainer.addEventListener('mousemove', handleMouseMove, false);
		ghostContainer.addEventListener('touchmove', handleMouseMove, false);
		ghostContainer.addEventListener('mouseup', cleanup, false);
		ghostContainer.addEventListener('touchend', cleanup, false);
		ghostContainer.addEventListener('touchcancel', cleanup, false);
		document.querySelector('html').addEventListener('mouseleave', cleanup, false);
	}

	const onHover = ev => {
		if (current?.type !== type) {
			return;
		}
		const acceptTarget = onVerify(ev, current);
		if (!acceptTarget) {
			return;
		}

		if (ev.type === 'mouseover' || ev.type === 'mousemove') {
			markAboveOrBelow(ev.currentTarget, getClientVec2(ev), midpointOffset);
		}
		if (ev.type === 'mouseout') {
			if (ev.relatedTarget === ev.currentTarget || ev.currentTarget.contains(ev.relatedTarget)) {
				return;
			}

			ev.currentTarget.classList.remove('dnd-target-below', 'dnd-target-above', 'dnd-target');
			ev.stopPropagation();
		}
		if (ev.type === 'mouseover') {
			ev.currentTarget.classList.add('dnd-target');
			cleanupNodes.add(ev.currentTarget);
			ev.stopPropagation();
		}
	}

	const onDrop = ev => {
		if (current?.type === type) {
			ev.currentTarget.classList.remove('dnd-target-below', 'dnd-target-above', 'dnd-target');
			const rect = ev.currentTarget.getBoundingClientRect();
			const top = rect.y;
			const above = ev.clientY - top <= rect.height * 0.5 + midpointOffset;
			onComplete(ev.currentTarget, above, current, ev);
		}
	}
	return { onDrag, onHover, onDrop };
}

export { useDnd };
