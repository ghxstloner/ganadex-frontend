"use client";

import { motion, AnimatePresence } from "framer-motion";
import { type ReactNode } from "react";

export type MotionFadeSlideProps = {
    children: ReactNode;
    className?: string;
    delay?: number;
};

export function MotionFadeSlide({
    children,
    className,
    delay = 0,
}: MotionFadeSlideProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{
                duration: 0.25,
                delay,
                ease: [0.25, 0.1, 0.25, 1],
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export type MotionScaleFadeProps = {
    children: ReactNode;
    className?: string;
    isOpen?: boolean;
};

export function MotionScaleFade({
    children,
    className,
    isOpen = true,
}: MotionScaleFadeProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                        duration: 0.15,
                        ease: [0.25, 0.1, 0.25, 1],
                    }}
                    className={className}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export type MotionListItemProps = {
    children: ReactNode;
    className?: string;
    index?: number;
};

export function MotionListItem({
    children,
    className,
    index = 0,
}: MotionListItemProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.2,
                delay: index * 0.03,
                ease: [0.25, 0.1, 0.25, 1],
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
