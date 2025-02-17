import React, { FC, useCallback, useEffect, useState } from 'react';
import SwiperCore from 'swiper';

import { BaseModal } from '@alfalab/core-components-base-modal';

import { Header, ImageViewer, NavigationBar } from './components';
import { GalleryContext } from './context';
import { GalleryImage, ImageMeta } from './types';

import styles from './index.module.css';

export type GalleryProps = {
    /**
     * Управление видимостью
     */
    open: boolean;

    /**
     * Массив изображений
     */
    images: GalleryImage[];

    /**
     * Зациклить галерею
     * @default true
     */
    loop?: boolean;

    /**
     * Индекс открытого изображение
     * @default 0
     */
    initialSlide?: number;

    /**
     * Обработчик закрытия
     */
    onClose: () => void;
};

const Backdrop = () => null;

export const Gallery: FC<GalleryProps> = ({
    open,
    images,
    initialSlide = 0,
    loop = true,
    onClose,
}) => {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(initialSlide);
    const [swiper, setSwiper] = useState<SwiperCore>();
    const [imagesMeta, setImagesMeta] = useState<ImageMeta[]>([]);
    const [fullScreen, setFullScreen] = useState(false);

    const slideTo = useCallback(
        (index: number) => {
            if (images[index]) {
                setCurrentSlideIndex(index);

                if (swiper) {
                    swiper.slideTo(index);
                }
            }
        },
        [images, swiper],
    );

    const slideNext = useCallback(() => {
        const lastIndex = images.length - 1;

        let nextIndex = currentSlideIndex + 1;

        if (nextIndex >= images.length) {
            nextIndex = loop ? 0 : lastIndex;
        }

        slideTo(nextIndex);
    }, [images.length, loop, currentSlideIndex, slideTo]);

    const slidePrev = useCallback(() => {
        const lastIndex = images.length - 1;

        let nextIndex = currentSlideIndex - 1;

        if (nextIndex < 0) {
            nextIndex = loop ? lastIndex : 0;
        }

        slideTo(nextIndex);
    }, [images.length, loop, currentSlideIndex, slideTo]);

    const setImageMeta = useCallback(
        (meta: ImageMeta, index: number) => {
            imagesMeta[index] = meta;

            setImagesMeta(imagesMeta.slice());
        },
        [imagesMeta],
    );

    const handleClose = useCallback(() => {
        onClose();

        setCurrentSlideIndex(initialSlide);
        setFullScreen(false);
    }, [initialSlide, onClose]);

    const handleEscapeKeyDown = () => {
        if (fullScreen) {
            setFullScreen(false);
        } else {
            handleClose();
        }
    };

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!open || fullScreen) {
                return;
            }

            switch (event.key) {
                case 'ArrowLeft':
                    slidePrev();
                    break;
                case 'ArrowRight':
                    slideNext();
                    break;
            }
        },
        [fullScreen, open, slideNext, slidePrev],
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    const singleSlide = images.length === 1;

    const showNavigationBar = !singleSlide && !fullScreen;

    // eslint-disable-next-line react/jsx-no-constructed-context-values
    const galleryContext: GalleryContext = {
        singleSlide,
        currentSlideIndex,
        images,
        imagesMeta,
        fullScreen,
        initialSlide,
        setFullScreen,
        setImageMeta,
        slideNext,
        slidePrev,
        slideTo,
        getSwiper: () => swiper,
        setSwiper,
        onClose: handleClose,
        setCurrentSlideIndex,
        getCurrentImage: () => images[currentSlideIndex],
        getCurrentImageMeta: () => imagesMeta[currentSlideIndex],
    };

    return (
        <GalleryContext.Provider value={galleryContext}>
            <BaseModal
                open={open}
                className={styles.modal}
                onEscapeKeyDown={handleEscapeKeyDown}
                Backdrop={Backdrop}
            >
                <div className={styles.container}>
                    <Header />

                    <ImageViewer />

                    {showNavigationBar && <NavigationBar />}
                </div>
            </BaseModal>
        </GalleryContext.Provider>
    );
};
