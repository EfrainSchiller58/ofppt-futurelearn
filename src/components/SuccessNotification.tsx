import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Shield, Sparkles, X, UserPlus, Trash2, Send, BookOpen, Users, LogIn } from "lucide-react";

type NotificationIcon = "check" | "shield" | "sparkles" | "user-plus" | "trash" | "send" | "book" | "users" | "login";

interface SuccessNotificationProps {
  show: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon?: NotificationIcon;
  accentColor?: string;
}

/* ──────────────────────────────────────────────────────────────────── *
 *  Floating particles that radiate outward from the center
 * ──────────────────────────────────────────────────────────────────── */
const Particle = ({ delay, angle, distance, size, color }: {
  delay: number; angle: number; distance: number; size: number; color: string;
}) => {
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * distance;
  const y = Math.sin(rad) * distance;

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        background: color,
        left: "50%",
        top: "50%",
        marginLeft: -size / 2,
        marginTop: -size / 2,
      }}
      initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        x: [0, x * 0.5, x],
        y: [0, y * 0.5, y],
        scale: [0, 1.5, 0.5],
      }}
      transition={{
        duration: 1.2,
        delay,
        ease: "easeOut",
      }}
    />
  );
};

/* ──────────────────────────────────────────────────────────────────── *
 *  Orbiting ring that pulses outward
 * ──────────────────────────────────────────────────────────────────── */
const PulseRing = ({ delay, color }: { delay: number; color: string }) => (
  <motion.div
    className="absolute rounded-full"
    style={{
      border: `2px solid ${color}`,
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
    }}
    initial={{ width: 40, height: 40, opacity: 0.8 }}
    animate={{
      width: [40, 140],
      height: [40, 140],
      opacity: [0.6, 0],
      marginLeft: [-20, -70],
      marginTop: [-20, -70],
    }}
    transition={{
      duration: 1,
      delay,
      ease: "easeOut",
    }}
  />
);

/* ──────────────────────────────────────────────────────────────────── *
 *  The main icon with animated checkmark / shield / sparkle
 * ──────────────────────────────────────────────────────────────────── */
const AnimatedIcon = ({ icon, accentColor }: { icon: string; accentColor: string }) => {
  const iconMap = {
    check: Check,
    shield: Shield,
    sparkles: Sparkles,
    "user-plus": UserPlus,
    trash: Trash2,
    send: Send,
    book: BookOpen,
    users: Users,
    login: LogIn,
  };
  const IconComponent = iconMap[icon as keyof typeof iconMap] || Check;

  return (
    <motion.div
      className="relative flex items-center justify-center"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 12,
        delay: 0.1,
      }}
    >
      {/* Glow background */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 80,
          height: 80,
          background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Icon circle */}
      <motion.div
        className="relative z-10 flex items-center justify-center rounded-full"
        style={{
          width: 56,
          height: 56,
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
          boxShadow: `0 0 30px ${accentColor}60, 0 0 60px ${accentColor}20`,
        }}
        animate={{
          boxShadow: [
            `0 0 30px ${accentColor}60, 0 0 60px ${accentColor}20`,
            `0 0 40px ${accentColor}80, 0 0 80px ${accentColor}40`,
            `0 0 30px ${accentColor}60, 0 0 60px ${accentColor}20`,
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 15,
            delay: 0.3,
          }}
        >
          <IconComponent className="w-7 h-7 text-white" strokeWidth={2.5} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

/* ──────────────────────────────────────────────────────────────────── *
 *  Main SuccessNotification component
 * ──────────────────────────────────────────────────────────────────── */
const SuccessNotification = ({
  show,
  onClose,
  title,
  description,
  icon = "check",
  accentColor = "#10b981",
}: SuccessNotificationProps) => {
  const [particles] = useState(() =>
    Array.from({ length: 16 }, (_, i) => ({
      id: i,
      angle: (360 / 16) * i + Math.random() * 20 - 10,
      distance: 60 + Math.random() * 40,
      size: 3 + Math.random() * 4,
      delay: 0.1 + Math.random() * 0.3,
      color: i % 3 === 0 ? accentColor : i % 3 === 1 ? "#60a5fa" : "#a78bfa",
    }))
  );

  // Auto-close after 4 seconds
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Subtle backdrop blur */}
          <motion.div
            className="absolute inset-0 backdrop-blur-[2px] pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Main notification card */}
          <motion.div
            className="relative pointer-events-auto"
            initial={{ scale: 0.5, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
          >
            {/* Glass card */}
            <div
              className="relative overflow-hidden rounded-2xl border backdrop-blur-xl px-8 py-7 min-w-[320px] max-w-[400px]"
              style={{
                background: "linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.95))",
                borderColor: `${accentColor}30`,
                boxShadow: `0 25px 60px rgba(0,0,0,0.4), 0 0 40px ${accentColor}15, inset 0 1px 0 rgba(255,255,255,0.05)`,
              }}
            >
              {/* Top accent line */}
              <motion.div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{
                  background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              />

              {/* Close button */}
              <motion.button
                className="absolute top-3 right-3 p-1 rounded-full transition-colors hover:bg-white/10"
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-4 h-4 text-white/50" />
              </motion.button>

              {/* Content */}
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Animated icon with particles */}
                <div className="relative w-[160px] h-[160px] flex items-center justify-center">
                  {/* Pulse rings */}
                  <PulseRing delay={0.2} color={accentColor} />
                  <PulseRing delay={0.5} color={accentColor} />
                  <PulseRing delay={0.8} color={accentColor} />

                  {/* Particles */}
                  {particles.map((p) => (
                    <Particle key={p.id} {...p} />
                  ))}

                  {/* Icon */}
                  <AnimatedIcon icon={icon} accentColor={accentColor} />
                </div>

                {/* Text */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {title}
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed max-w-[280px]">
                    {description}
                  </p>
                </motion.div>

                {/* Progress bar auto-close */}
                <motion.div
                  className="w-full h-1 rounded-full overflow-hidden mt-2"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)`,
                    }}
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 4, ease: "linear" }}
                  />
                </motion.div>
              </div>

              {/* Subtle grid pattern overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ──────────────────────────────────────────────────────────────────── *
 *  Hook for easy usage
 * ──────────────────────────────────────────────────────────────────── */
export function useSuccessNotification() {
  const [state, setState] = useState<{
    show: boolean;
    title: string;
    description: string;
    icon: NotificationIcon;
    accentColor: string;
  }>({
    show: false,
    title: "",
    description: "",
    icon: "check",
    accentColor: "#10b981",
  });

  const showSuccess = useCallback(
    (opts: {
      title: string;
      description: string;
      icon?: NotificationIcon;
      accentColor?: string;
    }) => {
      setState({
        show: true,
        title: opts.title,
        description: opts.description,
        icon: opts.icon ?? "check",
        accentColor: opts.accentColor ?? "#10b981",
      });
    },
    []
  );

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, show: false }));
  }, []);

  const NotificationComponent = (
    <SuccessNotification
      show={state.show}
      onClose={close}
      title={state.title}
      description={state.description}
      icon={state.icon}
      accentColor={state.accentColor}
    />
  );

  return { showSuccess, NotificationComponent };
}

export default SuccessNotification;
