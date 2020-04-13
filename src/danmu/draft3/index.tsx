/*
 * 方案三:最外层控制数组, 获取数据, 内层专注于渲染弹幕层;
 * 缺点: 动画效果卡顿;
 * 反思:由于获取数组并持续的更新show, 最外层一直在渲染, 所以很可能不是动画的问题, 下一步需要优化外部的更新机制;
 */

import React, { useEffect, useRef, useContext, useState, useLayoutEffect } from 'react';
import { PlayerContext } from '../../model';
import styled from 'styled-components';
import { fontArr, areaArr, opacityArr, getFontLength } from '../../utils/utils';
import fetch from '../../utils/request';
import Cover from './cover';

interface props {
  mode: string;
  size: number;
  area: number;
  opacity: number;
  width: number;
}

const Wrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 7;
  overflow: hidden;

  .con {
    width: 100%;
    height: ${(props: props) => areaArr[props.mode][props.area] * 100}%;
    color: white;
    font-size: ${(props: props) => fontArr[props.mode][props.size]}px;
    line-height: ${(props: props) => fontArr[props.mode][props.size] + 4}px;
    opacity: ${(props: props) => opacityArr[props.mode][props.opacity]};

    .danmu {
      position: absolute;
      display: inline-block;
      right: ${(props: props) => props.width}px;
      white-space: nowrap;
      transition: all 200 linear;
    }
  }
`;

interface PropsType {}

const reactComponent: React.FC<PropsType> = (props) => {
  const data = useContext(PlayerContext);
  const {
    state: { danmu, current, danmuArea, danmuFont, danmuShow, mode, danmuOpacity, play },
  } = data;

  if (!danmuShow) return <></>;

  const danmuRef = useRef<HTMLDivElement>({} as HTMLDivElement);
  const storeRef = useRef<any>({});

  if (!storeRef.current.top) {
    storeRef.current.top = [];
  }

  const [list, setList] = useState<Array<any>>([]);
  const [show, setShow] = useState<Array<any>>([]);
  const [width, setWidth] = useState<number>(0);
  const [total, setTotal] = useState(0);

  const initData = async (target: string) => {
    const data = await fetch(target).then((res) => res.json());
    setList(data.data);
  };

  const filterData = (list: Array<any>) => {
    list
      .filter(
        (item) =>
          item.time < current + 0.5 &&
          item.time > current - 0.5 &&
          !show.some((ele) => ele._id === item._id),
      )
      .map((item) => {
        draw(item);
      });
  };

  const draw = (value: any) => {
    const result = getEmptyDanmuTop();
    const selfWidth = (getFontLength(value.text) * fontArr[mode][danmuFont]) / 2;
    const preLeft = width + selfWidth;
    show.push({
      ...value,
      left: result.left < width ? preLeft : result.left + 30 + selfWidth,
      top: result.top,
    });
    setShow(show);
  };

  const getEmptyDanmuTop = () => {
    show.map((item) => {
      const left = item.left;
      const top = item.top;
      storeRef.current.top[top] = {
        left,
        top,
      };
    });

    let result = [...storeRef.current.top].sort((a, b) => a.left - b.left);
    const lessDanmu = result
      .filter((item) => item.top < total / 2 && item.top > 0 && Math.abs(width - item.left) < 100)
      .sort((a, b) => a.top - b.top);
    if (lessDanmu.length > 0) {
      result = lessDanmu;
    }

    return result[0];
  };

  useEffect(() => {
    initData(danmu);
  }, [danmu]);

  useEffect(() => {
    filterData(list);
  }, [current]);

  useEffect(() => {}, []);

  useLayoutEffect(() => {
    setWidth(danmuRef.current.clientWidth);
    const newTotal =
      Math.floor((danmuRef.current.clientHeight - 40) / fontArr[mode][danmuFont] + 4) - 1;

    if (newTotal === total) return;
    [...Array(newTotal)].map((item, index) => {
      if (!storeRef.current.top[index]) {
        storeRef.current.top[index] = {
          left: -1,
          top: index,
        };
      }
    });
    storeRef.current.top.length = newTotal;

    setTotal(newTotal);
  });

  return (
    <Wrapper
      ref={danmuRef}
      size={danmuFont}
      mode={mode}
      area={danmuArea}
      opacity={danmuOpacity}
      width={width}
      play={play}
    >
      <Cover list={show} play={play} lineHeight={fontArr[mode][danmuFont] + 4} />
    </Wrapper>
  );
};
export default reactComponent;
