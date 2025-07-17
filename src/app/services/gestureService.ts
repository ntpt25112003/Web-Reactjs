type GestureCallback = () => void;

class GestureService {
  private h_debug = false;
  private m_timeoutLongPress: any = null;
  private m_mapGestures: Map<HTMLElement, () => void> = new Map();

  public registerLongPress(el: HTMLElement, delay: number, callback: GestureCallback) {
    if (!el || this.m_mapGestures.has(el)) return;

    const onMouseDown = () => {
      this.m_timeoutLongPress = setTimeout(() => callback(), delay);
    };

    const onMouseUp = () => {
      clearTimeout(this.m_timeoutLongPress);
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mouseleave', onMouseUp);

    el.addEventListener('touchstart', onMouseDown);
    el.addEventListener('touchend', onMouseUp);
    el.addEventListener('touchcancel', onMouseUp);

    // Store cleanup function
    this.m_mapGestures.set(el, () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mouseleave', onMouseUp);

      el.removeEventListener('touchstart', onMouseDown);
      el.removeEventListener('touchend', onMouseUp);
      el.removeEventListener('touchcancel', onMouseUp);
    });

    if (this.h_debug) {
      console.log('[gestureService] Registered long press on element:', el);
    }
  }

  public unregisterLongPress() {
    for (const [el, cleanupFn] of this.m_mapGestures.entries()) {
      cleanupFn();
    }
    this.m_mapGestures.clear();

    if (this.h_debug) {
      console.log('[gestureService] Unregistered all long press gestures.');
    }
  }
}

const gestureService = new GestureService();
export default gestureService;
